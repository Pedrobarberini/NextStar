import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const feedSource = readFileSync(
  new URL("../src/screens/FeedScreen.tsx", import.meta.url),
  "utf8"
);
const volumeControlSource = readFileSync(
  new URL("../src/components/VideoVolumeControl.tsx", import.meta.url),
  "utf8"
);
const webShellSource = readFileSync(
  new URL("../scripts/prepare-web.mjs", import.meta.url),
  "utf8"
);

test("preserva o volume no estado do Feed durante remontagens do player", () => {
  assert.match(feedSource, /const \[feedVolume, setFeedVolume\] = useState\(0\)/);
  assert.match(feedSource, /onVolumeChange=\{setFeedVolume\}/);
  assert.match(feedSource, /volume=\{feedVolume\}/);
  assert.doesNotMatch(feedSource, /const \[volume, setVolume\] = useState\(0\)/);
});

test("isola o gesto do slider da navegacao vertical do Feed", () => {
  assert.match(volumeControlSource, /nativeID="xolot-volume-slider"/);
  assert.match(volumeControlSource, /onPanResponderMove: \(event\) => \{\s*event\.stopPropagation\(\)/);
  assert.match(webShellSource, /#xolot-volume-slider \{[\s\S]*touch-action: none;/);
});