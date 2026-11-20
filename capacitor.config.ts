import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.zeroodev.sekolahku",
  appName: "SekolahKu",
  webDir: "dist",
  server: {
    androidScheme: "https"
  }
};

export default config;
