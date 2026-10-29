package com.jonginzz.dowoomi

import android.Manifest
import android.content.Intent
import android.content.res.ColorStateList
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.view.LayoutInflater
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.jonginzz.dowoomi.databinding.ActivityPermissionBinding
import com.jonginzz.dowoomi.databinding.ItemPermissionBinding

class PermissionActivity : AppCompatActivity() {

    private lateinit var b: ActivityPermissionBinding

    /** 알림 권한 요청 (안드로이드 13 이상) */
    private val notifLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (!granted && Build.VERSION.SDK_INT >= 33 &&
            !shouldShowRequestPermissionRationale(Manifest.permission.POST_NOTIFICATIONS)
        ) {
            // 두 번 이상 거부하면 팝업이 더 안 뜨므로 앱 알림 설정으로 바로 보냄
            openAppNotificationSettings()
        }
        refresh()
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        b = ActivityPermissionBinding.inflate(layoutInflater)
        setContentView(b.root)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)

        b.btnRefresh.setOnClickListener { refresh() }
        b.btnDone.setOnClickListener { tryFinish() }
    }

    override fun onResume() {
        super.onResume()
        // 설정 화면에서 돌아올 때마다 상태 새로 확인
        refresh()
    }

    override fun onSupportNavigateUp(): Boolean {
        tryFinish()
        return true
    }

    private fun refresh() {
        val items = PermissionChecker.all(this)
        val okCount = items.count { it.granted }

        b.summaryText.text = if (okCount == items.size) {
            "모든 권한이 설정됐어요. '완료'를 눌러 처음 화면으로 돌아가세요."
        } else {
            "위에서부터 차례대로 '설정 열기'를 눌러 켜 주세요. 설정을 마치고 뒤로 돌아오면 상태가 자동으로 바뀌어요.\n(${okCount} / ${items.size} 완료)"
        }

        b.permissionList.removeAllViews()
        val inflater = LayoutInflater.from(this)

        items.forEachIndexed { index, item ->
            val row = ItemPermissionBinding.inflate(inflater, b.permissionList, false)
            row.itemTitle.text = "${index + 1}. ${item.title}"
            row.itemDesc.text = item.desc
            setBadge(row, item.granted)
            row.itemButton.text = if (item.granted) "설정 다시 열기" else "설정 열기"
            row.itemButton.setOnClickListener { openSettingFor(item.kind) }
            b.permissionList.addView(row.root)
        }

        // 안내용 항목: 셸 연결은 다음 단계에서 구현
        val shell = ItemPermissionBinding.inflate(inflater, b.permissionList, false)
        shell.itemTitle.text = "${items.size + 1}. 셸 연결 (무선 디버깅)"
        shell.itemDesc.text = "자동 터치와 화면 읽기를 담당하는 연결이에요. 다음 단계에서 앱 안에서 바로 연결할 수 있게 만들어요."
        shell.itemBadge.text = "다음 단계"
        shell.itemBadge.setTextColor(ContextCompat.getColor(this, R.color.info))
        shell.itemBadge.backgroundTintList =
            ColorStateList.valueOf(ContextCompat.getColor(this, R.color.info_bg))
        shell.itemButton.text = "준비 중"
        shell.itemButton.isEnabled = false
        b.permissionList.addView(shell.root)
    }

    private fun setBadge(row: ItemPermissionBinding, granted: Boolean) {
        val text = if (granted) R.color.ok else R.color.bad
        val bg = if (granted) R.color.ok_bg else R.color.bad_bg
        row.itemBadge.text = if (granted) "완료" else "안 됨"
        row.itemBadge.setTextColor(ContextCompat.getColor(this, text))
        row.itemBadge.backgroundTintList =
            ColorStateList.valueOf(ContextCompat.getColor(this, bg))
    }

    private fun openSettingFor(kind: PermKind) {
        when (kind) {
            PermKind.OVERLAY -> safeStart(
                Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:$packageName")
                )
            )

            PermKind.NOTIFICATION -> {
                if (Build.VERSION.SDK_INT >= 33 &&
                    !PermissionChecker.isNotificationGranted(this)
                ) {
                    notifLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                } else {
                    openAppNotificationSettings()
                }
            }

            PermKind.BATTERY -> {
                if (!PermissionChecker.isBatteryIgnored(this)) {
                    safeStart(
                        Intent(
                            Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
                            Uri.parse("package:$packageName")
                        )
                    )
                } else {
                    safeStart(Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS))
                }
            }

            PermKind.DEV_OPTIONS -> {
                if (PermissionChecker.isDevOptionsEnabled(this)) {
                    safeStart(Intent(Settings.ACTION_APPLICATION_DEVELOPMENT_SETTINGS))
                } else {
                    showDevOptionsGuide()
                }
            }
        }
    }

    /** 개발자 옵션은 앱이 직접 켤 수 없어서 방법을 안내한 뒤 휴대폰 정보 화면을 엶 */
    private fun showDevOptionsGuide() {
        AlertDialog.Builder(this)
            .setTitle("개발자 옵션 켜는 방법")
            .setMessage(
                "1. 아래 '이동'을 누르면 휴대폰 정보 화면이 열려요.\n" +
                    "2. 삼성폰: '소프트웨어 정보'를 눌러 들어가요.\n" +
                    "3. '빌드번호'를 7번 연속으로 톡톡 눌러요.\n" +
                    "4. 잠금 비밀번호를 물어보면 입력해요.\n" +
                    "5. '개발자 모드를 켰습니다'가 뜨면 뒤로 가기로 이 앱에 돌아와요."
            )
            .setPositiveButton("이동") { _, _ ->
                safeStart(Intent(Settings.ACTION_DEVICE_INFO_SETTINGS))
            }
            .setNegativeButton("취소", null)
            .show()
    }

    private fun openAppNotificationSettings() {
        val intent = Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
            .putExtra(Settings.EXTRA_APP_PACKAGE, packageName)
        safeStart(intent)
    }

    /** 기종마다 없는 설정 화면이 있어서, 실패하면 앱 정보 화면으로 대신 이동 */
    private fun safeStart(intent: Intent) {
        try {
            startActivity(intent)
        } catch (e: Exception) {
            try {
                startActivity(
                    Intent(
                        Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
                        Uri.parse("package:$packageName")
                    )
                )
                Toast.makeText(this, "앱 정보 화면에서 직접 설정해 주세요", Toast.LENGTH_LONG).show()
            } catch (e2: Exception) {
                Toast.makeText(this, "설정 화면을 열 수 없어요", Toast.LENGTH_LONG).show()
            }
        }
    }

    private fun tryFinish() {
        val missing = PermissionChecker.missing(this)
        if (missing.isEmpty()) {
            finish()
            return
        }
        AlertDialog.Builder(this)
            .setTitle("아직 안 된 권한이 있어요")
            .setMessage(missing.joinToString("\n") { "❌ ${it.title}" } +
                "\n\n그래도 처음 화면으로 돌아갈까요?")
            .setPositiveButton("돌아가기") { _, _ -> finish() }
            .setNegativeButton("계속 설정", null)
            .show()
    }
}
