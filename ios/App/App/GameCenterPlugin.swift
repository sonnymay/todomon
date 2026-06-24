import Capacitor
import Foundation

@objc(GameCenterPlugin)
final class GameCenterPlugin: CAPPlugin, CAPBridgedPlugin {
    let identifier = "GameCenterPlugin"
    let jsName = "GameCenter"
    let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "reportAchievement", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "resetAchievements", returnType: CAPPluginReturnPromise),
    ]

    override func load() {
        GameCenterManager.shared.authenticate(from: bridge?.viewController)
    }

    @objc func reportAchievement(_ call: CAPPluginCall) {
        guard let identifier = call.getString("identifier"), !identifier.isEmpty else {
            call.reject("Missing achievement identifier")
            return
        }

        GameCenterManager.shared.reportAchievement(identifier: identifier) { reported, reason in
            call.resolve([
                "reported": reported,
                "reason": reason ?? "",
            ])
        }
    }

    @objc func resetAchievements(_ call: CAPPluginCall) {
        #if DEBUG
        GameCenterManager.shared.resetAchievements { error in
            if let error {
                call.reject("Failed to reset Game Center achievements", nil, error)
            } else {
                call.resolve()
            }
        }
        #else
        call.reject("Achievement reset is debug-only")
        #endif
    }
}
