"use client";

import { AppProgressBar } from "next-nprogress-bar";

export default function ProgressBar() {
  return (
    <AppProgressBar
      height="3px"
      color="#5BB8B4"
      options={{ showSpinner: false }}
      shallowRouting
    />
  );
}
