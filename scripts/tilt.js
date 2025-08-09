// tilt.js (ES Module)

// 전역 RAF 큐: 카드가 많아도 한 프레임에 묶어서 처리
let rafId = null;
const frameQueue = new Set();
function scheduleFrame(fn) {
  frameQueue.add(fn);
  if (rafId) return;
  rafId = requestAnimationFrame(() => {
    frameQueue.forEach((f) => f());
    frameQueue.clear();
    rafId = null;
  });
}

const defaults = {
  max: 8, // 최대 기울기 각도(°) — 카드 기준 절반 이동 시 2*max 적용
  scale: 1.03, // 호버 확대 비율
  glare: false, // 글래어(빛 반사) 레이어 사용 여부
  easingOutMs: 300, // 포인터 떠날 때 복귀 트랜지션 시간
};

// 카드 하나에 이벤트/상태 바인딩
function attach(card) {
  // 옵션 병합 (data- 속성으로 카드별 조정)
  const opts = {
    max: parseFloat(card.dataset.tiltMax || "") || defaults.max,
    scale: parseFloat(card.dataset.tiltScale || "") || defaults.scale,
    glare: (card.dataset.tiltGlare || "false") === "true",
    easingOutMs:
      parseInt(card.dataset.tiltEaseout || "") || defaults.easingOutMs,
  };

  let rect = null;
  let pointerInside = false;

  // 글래어 레이어 준비(옵션)
  let glareEl = null;
  if (opts.glare) {
    glareEl = document.createElement("div");
    glareEl.className = "tilt-glare";
    card.style.position ||= "relative";
    card.appendChild(glareEl);
  }

  // 계산 및 렌더
  function compute(e) {
    if (!rect) rect = card.getBoundingClientRect();

    // 카드 내부 좌표(0~1) → -0.5~0.5로 정규화
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;

    const rotX = -ny * opts.max * 2;
    const rotY = nx * opts.max * 2;

    scheduleFrame(() => {
      const t = `rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(
        2
      )}deg) scale(${opts.scale})`;
      card.style.transform = t;
      card.classList.add("tilt-hovered");

      if (glareEl) {
        const gx = (nx + 0.5) * 100;
        const gy = (ny + 0.5) * 100;
        glareEl.style.background = `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,.35), rgba(255,255,255,0) 60%)`;
        glareEl.style.opacity = "1";
      }
    });
  }

  // 원위치
  function reset() {
    scheduleFrame(() => {
      card.style.transition = `transform ${opts.easingOutMs}ms cubic-bezier(.2,.6,.2,1), box-shadow ${opts.easingOutMs}ms`;
      card.style.transform = "rotateX(0deg) rotateY(0deg) scale(1)";
      card.classList.remove("tilt-hovered");
      if (glareEl) glareEl.style.opacity = "0";
      setTimeout(() => {
        card.style.transition = "";
      }, opts.easingOutMs + 20);
    });
  }

  // 이벤트 핸들러
  function onEnter(e) {
    pointerInside = true;
    rect = card.getBoundingClientRect();
    compute(e);
  }
  function onMove(e) {
    if (!pointerInside) return;
    compute(e);
  }
  function onLeave() {
    pointerInside = false;
    reset();
  }

  // Pointer 이벤트 등록(마우스/펜/터치)
  card.addEventListener("pointerenter", onEnter, { passive: true });
  card.addEventListener("pointermove", onMove, { passive: true });
  card.addEventListener("pointerleave", onLeave, { passive: true });
  card.addEventListener("pointercancel", onLeave, { passive: true });

  // 레이아웃 변동 시 bbox 갱신
  const invalidate = () => {
    rect = null;
  };
  window.addEventListener("scroll", invalidate, { passive: true });
  window.addEventListener("resize", invalidate, { passive: true });

  // 중복 해제/clean-up이 필요하면 반환값으로 핸들러 제거 로직을 만들어도 됨
}

// ✅ initTilt: 중복 바인딩 방지 포함
export function initTilt(root = document) {
  // 이미 바인딩된 요소는 data-tilt-bound로 걸러냄
  const candidates = Array.from(root.querySelectorAll(".tilt")).filter(
    (el) => !el.dataset.tiltBound
  );

  candidates.forEach((card) => {
    attach(card);
    card.dataset.tiltBound = "1"; // ✅ 중복 바인딩 방지 마킹
  });

  // 필요 시 외부에서 호출할 수 있는 유틸을 반환
  return {
    refreshBounds() {
      // 크기 캐시 무효화가 필요할 때 root 내부 요소들만 초기화
      Array.from(root.querySelectorAll('.tilt[data-tilt-bound="1"]')).forEach(
        (el) => {
          // 간단히 스타일 강제리플로우로도 충분하지만, 여기서는 noop.
          // 개별 카드에 invalidate hook을 저장해 두었다면 호출하도록 확장 가능.
        }
      );
    },
  };
}

// (선택) 자동 초기화가 필요하면 아래 주석 해제
// if (document.readyState === 'loading') {
//   document.addEventListener('DOMContentLoaded', () => initTilt());
// } else {
//   initTilt();
// }
