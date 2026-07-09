import { beforeEach, describe, expect, it, vi } from "vitest";

// qr-scanner を差し替え、Worker/DOM 無しの node 環境で decodeQr のロジックだけを検証する。
vi.mock("qr-scanner", () => {
  const QrScannerMock: any = vi.fn();
  QrScannerMock.scanImage = vi.fn();
  QrScannerMock.createQrEngine = vi.fn();
  QrScannerMock.NO_QR_CODE_FOUND = "No QR code found";
  return { default: QrScannerMock };
});

// モジュールレベルの共有エンジンをテストごとに初期化するため、resetModules 後に動的 import する。
const load = async () => {
  const QrScanner = (await import("qr-scanner")).default as any;
  const { decodeQr } = await import("./decode-qr");
  return { QrScanner, decodeQr };
};

const source = {} as HTMLVideoElement;

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe("decodeQr", () => {
  it("QR を検出したらデコード文字列を返す", async () => {
    const { QrScanner, decodeQr } = await load();
    QrScanner.createQrEngine.mockResolvedValue({});
    QrScanner.scanImage.mockResolvedValue({ data: "forward", cornerPoints: [] });

    expect(await decodeQr(source)).toBe("forward");
    expect(QrScanner.scanImage).toHaveBeenCalledWith(
      source,
      expect.objectContaining({ returnDetailedScanResult: true }),
    );
  });

  it("QR 未検出（文字列 throw）は null を返す", async () => {
    const { QrScanner, decodeQr } = await load();
    QrScanner.createQrEngine.mockResolvedValue({});
    QrScanner.scanImage.mockRejectedValue("No QR code found");

    expect(await decodeQr(source)).toBeNull();
  });

  it("QR 未検出（Error throw）も null を返す", async () => {
    const { QrScanner, decodeQr } = await load();
    QrScanner.createQrEngine.mockResolvedValue({});
    QrScanner.scanImage.mockRejectedValue(new Error("No QR code found"));

    expect(await decodeQr(source)).toBeNull();
  });

  it("未検出以外の失敗は再 throw する", async () => {
    const { QrScanner, decodeQr } = await load();
    QrScanner.createQrEngine.mockResolvedValue({});
    QrScanner.scanImage.mockRejectedValue(new Error("engine boom"));

    await expect(decodeQr(source)).rejects.toThrow("engine boom");
  });

  it("エンジンは生成後に使い回す（複数回デコードしても createQrEngine は 1 回）", async () => {
    const { QrScanner, decodeQr } = await load();
    QrScanner.createQrEngine.mockResolvedValue({});
    QrScanner.scanImage.mockResolvedValue({ data: "x", cornerPoints: [] });

    await decodeQr(source);
    await decodeQr(source);

    expect(QrScanner.createQrEngine).toHaveBeenCalledTimes(1);
  });
});
