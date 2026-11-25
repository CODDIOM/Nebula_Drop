// Google AdSense (Web) + Google AdMob (Capacitor Mobil) Reklam Servisi
// Web'de canlı reklam için:
// 1. Oyunu kendi domaininize (örn. nebula.coddiom.com) bağlayın
// 2. ADSENSE_CONFIG.enabled = true yapın ve client + bannerSlot ID'lerinizi girin

export const ADSENSE_CONFIG = {
  enabled: false,
  client: "ca-pub-xxxxxxxxxxxxxxxx", // Örn: "ca-pub-1234567890123456"
  bannerSlot: "xxxxxxxxxx",          // AdSense'te oluşturduğunuz 320x50 Banner Slot ID
};

export const AD_CONFIG = {
  useTestIds: true,
  testIds: {
    android: {
      banner: "ca-app-pub-3940256099942544/6300978111",
      interstitial: "ca-app-pub-3940256099942544/1033173712",
      rewarded: "ca-app-pub-3940256099942544/5224354917",
    },
    ios: {
      banner: "ca-app-pub-3940256099942544/2934735716",
      interstitial: "ca-app-pub-3940256099942544/4411468910",
      rewarded: "ca-app-pub-3940256099942544/1712485313",
    },
  },
  liveIds: {
    android: {
      banner: "ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx",
      interstitial: "ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx",
      rewarded: "ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx",
    },
    ios: {
      banner: "ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx",
      interstitial: "ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx",
      rewarded: "ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx",
    },
  },
};

class AdService {
  constructor() {
    this.isNative = Boolean(window.Capacitor?.isNativePlatform?.());
    this.platform = window.Capacitor?.getPlatform?.() === "ios" ? "ios" : "android";
    this.adMobPlugin = window.Capacitor?.Plugins?.AdMob || null;
    this.initialized = false;
    this.bannerShown = false;
    this.adSenseScriptLoaded = false;
    this.adSenseBannerPushed = false;
  }

  getUnitId(type) {
    const group = AD_CONFIG.useTestIds ? AD_CONFIG.testIds : AD_CONFIG.liveIds;
    return group[this.platform][type];
  }

  isAdSenseReady() {
    return (
      !this.isNative &&
      ADSENSE_CONFIG.enabled &&
      ADSENSE_CONFIG.client !== "ca-pub-xxxxxxxxxxxxxxxx" &&
      ADSENSE_CONFIG.bannerSlot !== "xxxxxxxxxx"
    );
  }

  hasBannerSupport() {
    return this.isNative ? Boolean(this.adMobPlugin) : this.isAdSenseReady();
  }

  hasInterstitialSupport() {
    return Boolean(this.isNative && this.adMobPlugin);
  }

  hasRewardedSupport() {
    return Boolean(this.isNative && this.adMobPlugin);
  }

  loadAdSenseScript() {
    if (this.adSenseScriptLoaded || !this.isAdSenseReady()) return;
    this.adSenseScriptLoaded = true;
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CONFIG.client}`;
    s.crossOrigin = "anonymous";
    document.head.appendChild(s);
  }

  async init() {
    if (!this.isNative) {
      this.loadAdSenseScript();
      return;
    }
    if (!this.adMobPlugin || this.initialized) return;
    try {
      await this.adMobPlugin.initialize({
        initializeForTesting: AD_CONFIG.useTestIds,
      });
      this.initialized = true;
    } catch {
      // Ignore init error outside native runtime
    }
  }

  async setBannerVisible(visible, slotEl = null) {
    if (slotEl) {
      const shouldShowWebBanner = !this.isNative && visible && this.isAdSenseReady();
      slotEl.classList.toggle("hidden", this.isNative ? !visible : !shouldShowWebBanner);

      // Web Google AdSense Banner rendering
      if (shouldShowWebBanner) {
        this.loadAdSenseScript();
        if (!this.adSenseBannerPushed) {
          slotEl.innerHTML = `<ins class="adsbygoogle" style="display:inline-block;width:320px;height:50px" data-ad-client="${ADSENSE_CONFIG.client}" data-ad-slot="${ADSENSE_CONFIG.bannerSlot}"></ins>`;
          try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            this.adSenseBannerPushed = true;
          } catch {
            // Ignore until script finishes loading
          }
        }
      }
    }

    if (!this.isNative || !this.adMobPlugin) return;
    await this.init();
    try {
      if (visible && !this.bannerShown) {
        await this.adMobPlugin.showBanner({
          adId: this.getUnitId("banner"),
          adSize: "ADAPTIVE_BANNER",
          position: "BOTTOM_CENTER",
          margin: 0,
          isTesting: AD_CONFIG.useTestIds,
        });
        this.bannerShown = true;
      } else if (!visible && this.bannerShown) {
        await this.adMobPlugin.hideBanner();
        this.bannerShown = false;
      }
    } catch {
      // Ignore banner errors
    }
  }

  showPreviewOverlay(eyebrow, title, bodyHtml, seconds = 2) {
    return new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.className = "sheet-modal";
      overlay.innerHTML = `
        <div class="modal-card">
          <div class="modal-eyebrow" style="color:#22d3ee">${eyebrow}</div>
          <h3 style="margin-bottom:8px;">${title}</h3>
          <p style="font-size:12px;color:#94a3b8;margin-bottom:14px;">${bodyHtml}</p>
          <div id="adCountdownText" style="font-size:14px;font-weight:800;color:#fbbf24;">Kapanıyor (${seconds}sn)...</div>
        </div>
      `;
      document.body.appendChild(overlay);
      let left = seconds;
      const timer = setInterval(() => {
        left -= 1;
        const label = overlay.querySelector("#adCountdownText");
        if (left > 0 && label) {
          label.textContent = `Kapanıyor (${left}sn)...`;
        } else {
          clearInterval(timer);
          overlay.remove();
          resolve(true);
        }
      }, 750);
    });
  }

  async showInterstitial() {
    if (this.isNative && this.adMobPlugin) {
      await this.init();
      try {
        await this.adMobPlugin.prepareInterstitial({
          adId: this.getUnitId("interstitial"),
          isTesting: AD_CONFIG.useTestIds,
        });
        await this.adMobPlugin.showInterstitial();
        return true;
      } catch {
        return false;
      }
    }

    return false;
  }

  async showRewardedAd(_rewardLabel = "+50 Stardust") {
    if (this.isNative && this.adMobPlugin) {
      await this.init();
      try {
        await this.adMobPlugin.prepareRewardVideoAd({
          adId: this.getUnitId("rewarded"),
          isTesting: AD_CONFIG.useTestIds,
        });
        const reward = await this.adMobPlugin.showRewardVideoAd();
        return Boolean(reward);
      } catch {
        return false;
      }
    }

    return false;
  }
}

export const ads = new AdService();
