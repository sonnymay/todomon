import Capacitor

@objc(AppBridgeViewController)
final class AppBridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        super.capacitorDidLoad()
        bridge?.registerPluginInstance(GameCenterPlugin())
        GameCenterManager.shared.authenticate(from: self)
    }
}
