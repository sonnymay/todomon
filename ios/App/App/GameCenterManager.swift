import Foundation
import GameKit
import UIKit

final class GameCenterManager {
    static let shared = GameCenterManager()

    private let reportedKey = "todomon_game_center_reported_v1"
    private var reported: Set<String>
    private var loadedRemoteAchievements = false
    private weak var presentingViewController: UIViewController?

    private init() {
        reported = Set(UserDefaults.standard.stringArray(forKey: reportedKey) ?? [])
    }

    func authenticate(from viewController: UIViewController?) {
        presentingViewController = viewController
        GKLocalPlayer.local.authenticateHandler = { [weak self] authViewController, error in
            DispatchQueue.main.async {
                guard let self else { return }
                if let authViewController {
                    (viewController ?? self.presentingViewController)?.present(authViewController, animated: true)
                    return
                }
                if GKLocalPlayer.local.isAuthenticated {
                    self.loadCompletedAchievements()
                } else if let error {
                    print("Game Center unavailable: \(error.localizedDescription)")
                }
            }
        }
    }

    func reportAchievement(identifier: String, completion: @escaping (Bool, String?) -> Void = { _, _ in }) {
        guard GKLocalPlayer.local.isAuthenticated else {
            completion(false, "notAuthenticated")
            return
        }
        guard !reported.contains(identifier) else {
            completion(false, "alreadyReported")
            return
        }

        let achievement = GKAchievement(identifier: identifier)
        achievement.percentComplete = 100.0
        achievement.showsCompletionBanner = true

        GKAchievement.report([achievement]) { [weak self] error in
            DispatchQueue.main.async {
                if let error {
                    print("Game Center achievement \(identifier) failed: \(error.localizedDescription)")
                    completion(false, error.localizedDescription)
                    return
                }
                self?.markReported(identifier)
                completion(true, nil)
            }
        }
    }

    #if DEBUG
    func resetAchievements(completion: @escaping (Error?) -> Void = { _ in }) {
        GKAchievement.resetAchievements { [weak self] error in
            DispatchQueue.main.async {
                if error == nil {
                    self?.reported.removeAll()
                    UserDefaults.standard.removeObject(forKey: self?.reportedKey ?? "")
                    self?.loadedRemoteAchievements = false
                }
                completion(error)
            }
        }
    }
    #endif

    private func loadCompletedAchievements() {
        guard !loadedRemoteAchievements else { return }
        loadedRemoteAchievements = true
        GKAchievement.loadAchievements { [weak self] achievements, error in
            DispatchQueue.main.async {
                guard let self else { return }
                if let error {
                    print("Game Center achievements unavailable: \(error.localizedDescription)")
                    return
                }
                achievements?
                    .filter { $0.isCompleted }
                    .forEach { self.markReported($0.identifier) }
            }
        }
    }

    private func markReported(_ identifier: String) {
        reported.insert(identifier)
        UserDefaults.standard.set(Array(reported), forKey: reportedKey)
    }
}
