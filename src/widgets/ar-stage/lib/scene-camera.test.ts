import { describe, expect, it } from "vitest";

import { computeSceneCamera } from "./scene-camera";

/** 注視点からカメラまでの距離。 */
const distanceToTarget = (config: ReturnType<typeof computeSceneCamera>): number => {
  const [px, py, pz] = config.position;
  const [tx, ty, tz] = config.target;
  return Math.hypot(px - tx, py - ty, pz - tz);
};

describe("computeSceneCamera", () => {
  it("迷路中心（x=0, z=0）を上方手前から見下ろす", () => {
    const config = computeSceneCamera(5, 1);
    expect(config.target[0]).toBe(0);
    expect(config.target[2]).toBe(0);
    expect(config.position[0]).toBe(0);
    // カメラは注視点より上・手前（+z）。
    expect(config.position[1]).toBeGreaterThan(config.target[1]);
    expect(config.position[2]).toBeGreaterThan(0);
    expect(Number.isFinite(config.fov)).toBe(true);
  });

  it("迷路が大きいほどカメラが遠くなる（全体を収める）", () => {
    const small = computeSceneCamera(5, 1);
    const large = computeSceneCamera(7, 1);
    expect(distanceToTarget(large)).toBeGreaterThan(distanceToTarget(small));
  });

  it("階層が多いほど注視点・カメラが高くなる", () => {
    const single = computeSceneCamera(5, 1);
    const triple = computeSceneCamera(5, 3);
    expect(triple.target[1]).toBeGreaterThan(single.target[1]);
    expect(triple.position[1]).toBeGreaterThan(single.position[1]);
    expect(distanceToTarget(triple)).toBeGreaterThan(distanceToTarget(single));
  });
});
