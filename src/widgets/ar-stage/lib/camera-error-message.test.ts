import { describe, expect, it } from "vitest";

import { CAMERA_ERROR_CODE } from "@/shared/camera";

import { CAMERA_ERROR_MESSAGES, getCameraErrorMessage } from "./camera-error-message";

describe("camera-error-message", () => {
  it("全エラーコードに文言が定義されている", () => {
    for (const code of Object.values(CAMERA_ERROR_CODE)) {
      const message = getCameraErrorMessage(code);
      expect(message.title.length).toBeGreaterThan(0);
      expect(message.description.length).toBeGreaterThan(0);
    }
  });

  it("環境要因（insecure-context / unsupported）だけが再試行不可", () => {
    const notRetryable = Object.entries(CAMERA_ERROR_MESSAGES)
      .filter(([, message]) => !message.retryable)
      .map(([code]) => code)
      .sort();
    expect(notRetryable).toEqual(
      [CAMERA_ERROR_CODE.INSECURE_CONTEXT, CAMERA_ERROR_CODE.UNSUPPORTED].sort(),
    );
  });

  it("permission-denied は再試行できる", () => {
    expect(getCameraErrorMessage(CAMERA_ERROR_CODE.PERMISSION_DENIED).retryable).toBe(true);
  });
});
