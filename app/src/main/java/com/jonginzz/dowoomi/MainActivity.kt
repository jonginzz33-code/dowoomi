package com.jonginzz.dowoomi

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import com.jonginzz.dowoomi.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {

    private lateinit var b: ActivityMainBinding
    private var permDialog: AlertDialog? = null

    /** "나중에"를 누르면 앱을 다시 켤 때까지는 팝업을 띄우지 않음 */
    private var skippedThisSession = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        b = ActivityMainBinding.inflate(layoutInflater)
        setContentView(b.root)

        b.versionText.text = "버전 ${BuildConfig.VERSION_NAME}"

        b.btnBannerFix.setOnClickListener { openPermissionScreen() }
        b.btnPermissions.setOnClickListener { openPermissionScreen() }

        // 아직 만들지 않은 메뉴 (다음 단계에서 하나씩 구현)
        val comingSoon = { name: String ->
            Toast.makeText(this, "$name 화면은 다음 단계에서 만들어요", Toast.LENGTH_SHORT).show()
        }
        b.btnScripts.setOnClickListener { comingSoon("스크립트 목록") }
        b.btnRegions.setOnClickListener { comingSoon("읽기 영역 지정") }
        b.btnTouch.setOnClickListener { comingSoon("터치 설정") }
        b.btnShell.setOnClickListener { comingSoon("셸 연결") }

        b.btnRun.setOnClickListener {
            if (PermissionChecker.missing(this).isNotEmpty()) {
                showPermissionDialog(force = true)
            } else {
                comingSoon("실행")
            }
        }
    }

    override fun onResume() {
        super.onResume()
        refreshStatus()
        if (!skippedThisSession) showPermissionDialog(force = false)
    }

    private fun refreshStatus() {
        val all = PermissionChecker.all(this)
        val missing = all.filter { !it.granted }
        val okCount = all.size - missing.size

        b.statusText.text = "권한 $okCount / ${all.size} 완료 · 셸 연결: 아직 없음"

        if (missing.isEmpty()) {
            b.permissionBanner.visibility = android.view.View.GONE
        } else {
            b.permissionBanner.visibility = android.view.View.VISIBLE
            b.bannerText.text = "설정이 안 된 권한 ${missing.size}개: " +
                missing.joinToString(", ") { it.title }
        }
    }

    /** 첫 화면 팝업: 무엇이 되어 있고 무엇이 안 되어 있는지 보여 줌 */
    private fun showPermissionDialog(force: Boolean) {
        val all = PermissionChecker.all(this)
        val missing = all.filter { !it.granted }
        if (missing.isEmpty()) {
            permDialog?.dismiss()
            return
        }
        if (!force && permDialog?.isShowing == true) return
        permDialog?.dismiss()

        val message = buildString {
            append("앱을 쓰려면 아래 권한이 필요해요.\n\n")
            all.forEach {
                append(if (it.granted) "✅ " else "❌ ")
                append(it.title)
                append(if (it.granted) "  (완료)" else "  (안 됨)")
                append("\n")
            }
            append("\n'권한 설정'을 누르면 하나씩 켤 수 있는 화면으로 이동해요.")
        }

        permDialog = AlertDialog.Builder(this)
            .setTitle("권한 설정이 필요해요 (${missing.size}개)")
            .setMessage(message)
            .setCancelable(false)
            .setPositiveButton("권한 설정") { _, _ -> openPermissionScreen() }
            .setNegativeButton("나중에") { _, _ -> skippedThisSession = true }
            .show()
    }

    private fun openPermissionScreen() {
        startActivity(Intent(this, PermissionActivity::class.java))
    }
}
