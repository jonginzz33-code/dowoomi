package com.jonginzz.dowoomi

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat

/** 앱이 동작하는 데 필요한 권한 종류 */
enum class PermKind { OVERLAY, NOTIFICATION, BATTERY, DEV_OPTIONS }

/** 화면에 보여 줄 권한 한 줄 정보 */
data class PermItem(
    val kind: PermKind,
    val title: String,
    val desc: String,
    val granted: Boolean
)

/** 권한 상태를 한곳에서 확인하는 도우미 */
object PermissionChecker {

    fun isOverlayGranted(ctx: Context): Boolean =
        Settings.canDrawOverlays(ctx)

    fun isNotificationGranted(ctx: Context): Boolean =
        if (Build.VERSION.SDK_INT >= 33) {
            ContextCompat.checkSelfPermission(
                ctx, Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
        } else {
            NotificationManagerCompat.from(ctx).areNotificationsEnabled()
        }

    fun isBatteryIgnored(ctx: Context): Boolean {
        val pm = ctx.getSystemService(Context.POWER_SERVICE) as PowerManager
        return pm.isIgnoringBatteryOptimizations(ctx.packageName)
    }

    fun isDevOptionsEnabled(ctx: Context): Boolean =
        Settings.Global.getInt(
            ctx.contentResolver,
            Settings.Global.DEVELOPMENT_SETTINGS_ENABLED, 0
        ) == 1

    fun isGranted(ctx: Context, kind: PermKind): Boolean = when (kind) {
        PermKind.OVERLAY -> isOverlayGranted(ctx)
        PermKind.NOTIFICATION -> isNotificationGranted(ctx)
        PermKind.BATTERY -> isBatteryIgnored(ctx)
        PermKind.DEV_OPTIONS -> isDevOptionsEnabled(ctx)
    }

    /** 필수 권한 전체 목록 (위에서부터 설정 순서) */
    fun all(ctx: Context): List<PermItem> = listOf(
        PermItem(
            PermKind.OVERLAY,
            "다른 앱 위에 표시",
            "실행 상태와 읽어 온 값을 화면 맨 위 작은 창으로 보여 주는 데 필요해요.",
            isOverlayGranted(ctx)
        ),
        PermItem(
            PermKind.NOTIFICATION,
            "알림",
            "앱이 뒤에서 실행 중일 때 알림줄에 상태를 표시하고, 시스템이 앱을 끄지 않게 하는 데 필요해요.",
            isNotificationGranted(ctx)
        ),
        PermItem(
            PermKind.BATTERY,
            "배터리 최적화 제외",
            "화면이 꺼지거나 오래 실행할 때 휴대폰이 앱을 멈추지 않게 해요.",
            isBatteryIgnored(ctx)
        ),
        PermItem(
            PermKind.DEV_OPTIONS,
            "개발자 옵션 켜기",
            "자동 터치·화면 읽기에 쓰는 셸 연결(무선 디버깅)을 하려면 먼저 개발자 옵션이 켜져 있어야 해요.",
            isDevOptionsEnabled(ctx)
        )
    )

    fun missing(ctx: Context): List<PermItem> = all(ctx).filter { !it.granted }
}
