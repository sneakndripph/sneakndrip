"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    fbAsyncInit?: () => void;
    FB?: { init: (opts: object) => void };
  }
}

export default function MessengerChat({ pageId }: { pageId: string }) {
  useEffect(() => {
    if (!pageId) return;

    window.fbAsyncInit = function () {
      window.FB?.init({ xfbml: true, version: "v18.0" });
    };

    if (!document.getElementById("facebook-jssdk")) {
      const js = document.createElement("script");
      js.id = "facebook-jssdk";
      js.src = "https://connect.facebook.net/en_US/sdk/xfbml.customerchat.js";
      js.async = true;
      js.defer = true;
      document.body.appendChild(js);
    }
  }, [pageId]);

  if (!pageId) return null;

  return (
    <>
      <div id="fb-root" />
      <div
        className="fb-customerchat"
        data-attribution="biz_inbox"
        data-page_id={pageId}
        data-theme_color="#5BB8B4"
        data-logged_in_greeting="Hi! How can we help you today? 👟"
        data-logged_out_greeting="Hi! How can we help you today? 👟"
      />
    </>
  );
}
