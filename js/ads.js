// AdMob & IAP Soyutlama Katmanı (Capacitor + Web Önizleme Desteği)

class AdService {
  constructor() {
    this.isNative = Boolean(window.Capacitor?.isNativePlatform?.());
    this.adMobPlugin = window.Capacitor?.Plugins?.AdMob || null;
  }

  async showRewardedAd(rewardLabel = "+50 Stardust") {
    // 1. Gerçek Capacitor + AdMob ortamında çalışıyorsa native ödüllü reklamı aç
    if (this.isNative && this.adMobPlugin) {
      try {
        await this.adMobPlugin.prepareRewardVideoAd({
          adId: "ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx", // Canlı AdMob Rewarded ID ile değiştirin
        });
        const reward = await this.adMobPlugin.showRewardVideoAd();
        return Boolean(reward);
      } catch {
        return false;
      }
    }

    // 2. Web / PWA test ortamında 1.5 saniyelik simüle reklam deneyimi
    return new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.className = "sheet-modal";
      overlay.innerHTML = `
        <div class="modal-card">
          <div class="modal-eyebrow" style="color:#22d3ee">ÖDÜLLÜ REKLAM ÖNİZLEME</div>
          <h3 style="margin-bottom:8px;">🎬 Sponsorlu Alan</h3>
          <p style="font-size:12px;color:#94a3b8;margin-bottom:14px;">
            Canlı mobil derlemede burada AdMob ödüllü video oynatılır.<br/>Ödül: <strong>${rewardLabel}</strong>
          </p>
          <div id="adCountdownText" style="font-size:14px;font-weight:800;color:#fbbf24;">Ödül hazırlanıyor (2sn)...</div>
        </div>
      `;
      document.body.appendChild(overlay);
      let left = 2;
      const timer = setInterval(() => {
        left -= 1;
        const label = overlay.querySelector("#adCountdownText");
        if (left > 0 && label) {
          label.textContent = `Ödül hazırlanıyor (${left}sn)...`;
        } else {
          clearInterval(timer);
          overlay.remove();
          resolve(true);
        }
      }, 750);
    });
  }
}

export const ads = new AdService();
