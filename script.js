import {
  addPoster,
  auth,
  deletePoster,
  getPosters,
  isLoggedIn,
  signOutFirebase,
} from "./firebase.js";
import { initTilt } from "./scripts/tilt.js";

const allowedEmailArr = ["2411129@saerom.hs.kr"];

const categories = [
  "전체",
  "이벤트",
  "홍보자료",
  "공지사항&일정",
  "우리학년 소식",
  "이달의 인물",
];
let selectedCategory = categories[0];
const viewToggleArr = ["포스터형 보기", "리스트형 보기", "그리드로 보기"];
let currentViewIndex = 0;
let currentViewMethod = viewToggleArr[currentViewIndex];

let currentSlideIndex = 0;
let posterData = [];

let currentdeletingDocId = "";

function renderCategories() {
  const tabContainer = document.getElementById("categoryTabs");
  const categorySelect = document.getElementById("newCategory");
  tabContainer.innerHTML = "";
  categorySelect.innerHTML = '<option value="">선택하세요</option>';
  categories.forEach((cat) => {
    if (cat === "전체") return;
    const el = document.createElement("div");
    el.className = "category-tab" + (cat === selectedCategory ? " active" : "");
    el.textContent = cat;
    el.onclick = () => {
      selectedCategory = cat;
      currentSlideIndex = 0;
      renderCategories();
      render();
    };
    tabContainer.appendChild(el);

    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    categorySelect.appendChild(opt);
  });
}

function render() {
  const carouselView = document.getElementById("carouselView");
  const listView = document.getElementById("listView");
  const gridView = document.getElementById("gridView");
  const track = document.getElementById("carouselTrack");
  listView.innerHTML = "";
  track.innerHTML = "";
  gridView.innerHTML = "";

  let filtered = posterData.filter((p) => p.category === selectedCategory);
  if (selectedCategory === "전체") {
    filtered = posterData;
  }
  filtered.sort((a, b) => b.docId - a.docId);
  if (currentViewMethod === "리스트형 보기") {
    listView.style.display = "flex";
    carouselView.style.display = "none";
    gridView.style.display = "none";

    filtered.forEach((poster) => {
      const item = document.createElement("div");
      item.className = "list-item";
      if (poster.author.email === auth.currentUser.email) {
        item.classList.add("enable-delete");
      }
      item.onclick = () => openModal(poster.title, poster.desc, poster.img);
      item.innerHTML = `
        <img src="${poster.img}" alt="${poster.title}" />
        <div class="list-info">
          <h3>${poster.title} <span class="badge">${poster.badge}</span></h3>
          <div class="movie-meta">기간: ${poster.meta}</div>
        </div>
        <button class="reserve-btn delete-doc-btn" data-docId="${poster.docId}">삭제</button>
      `;
      listView.appendChild(item);
    });
  } else if (currentViewMethod === "포스터형 보기") {
    listView.style.display = "none";
    gridView.style.display = "none";
    carouselView.style.display = "block";
    filtered.forEach((poster, index) => {
      const card = document.createElement("div");
      card.className = "movie-card";
      if (poster.author.email === auth.currentUser.email) {
        card.classList.add("enable-delete");
      }
      card.onclick = () => openModal(poster.title, poster.desc, poster.img);
      card.innerHTML = `
      <img src="${poster.img}" alt="${poster.title}" />
        <div class="movie-info">
          <h3>${poster.title} <span class="badge">${poster.badge}</span></h3>
          <div class="movie-meta">기간: ${poster.meta}</div>
          <button class="reserve-btn">자세히 보기</button>
          <button class="reserve-btn delete-doc-btn" data-docId="${poster.docId}">삭제</button>
        </div>
        `;
      track.appendChild(card);
    });
  } else if (currentViewMethod === "그리드로 보기") {
    listView.style.display = "none";
    carouselView.style.display = "none";
    gridView.style.display = "grid";

    filtered.forEach((poster, index) => {
      const card = document.createElement("div");
      card.className = "grid-card tilt";
      card.dataset.tiltMax = "8";
      card.dataset.tiltScale = "1.03";
      if (poster.author.email === auth.currentUser.email) {
        card.classList.add("enable-delete");
      }
      card.onclick = () => openModal(poster.title, poster.desc, poster.img);
      card.innerHTML = `
      <img src="${poster.img}" alt="${poster.title}" />
      <div class="tilt-glare"></div>
      `;
      gridView.appendChild(card);
    });
    initTilt(gridView);
  }
  document.querySelectorAll(".delete-doc-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();

      console.log(e.target.dataset.docid);
      currentdeletingDocId = e.target.dataset.docid;
      openWarnModal("삭제하시겠습니까?");
    });
  });
}

function toggleView() {
  if (currentViewIndex + 1 === viewToggleArr.length) {
    currentViewIndex = 0;
  } else {
    currentViewIndex++;
  }

  if (currentViewIndex + 1 === viewToggleArr.length) {
    document.getElementById("viewToggle").textContent = viewToggleArr[0];
  } else {
    document.getElementById("viewToggle").textContent =
      viewToggleArr[currentViewIndex + 1];
  }

  currentViewMethod = viewToggleArr[currentViewIndex];
  render();
}

function moveToNextSlide() {
  const cardWidth = 400;
  const filtered = posterData.filter((p) => p.category === selectedCategory);
  currentSlideIndex = (currentSlideIndex + 1) % filtered.length;
  document.getElementById("carouselWrapper").scrollTo({
    left: currentSlideIndex * cardWidth,
    behavior: "smooth",
  });
}

function moveToPrevSlide() {
  const cardWidth = 400;
  const filtered = posterData.filter((p) => p.category === selectedCategory);
  currentSlideIndex =
    (currentSlideIndex - 1 + filtered.length) % filtered.length;
  document.getElementById("carouselWrapper").scrollTo({
    left: currentSlideIndex * cardWidth,
    behavior: "smooth",
  });
}

document.querySelector(".right").addEventListener("click", moveToNextSlide);
document.querySelector(".left").addEventListener("click", moveToPrevSlide);
document.querySelector("#viewToggle").addEventListener("click", toggleView);
document.querySelector(".close-btn").addEventListener("click", closeModal);
document.querySelector(".reserve-btn").addEventListener("click", openAddModal);
document
  .querySelector(".signOut-btn")
  .addEventListener("click", signOutFirebase);
document
  .querySelector("#close-add-modal")
  .addEventListener("click", closeAddModal);
document.querySelector(".cancel-btn").addEventListener("click", closeWarnModal);
document.querySelector(".delete-confirm-btn").addEventListener("click", (e) => {
  deletePoster(currentdeletingDocId);
});

function openModal(title, desc, img) {
  document.getElementById("modalTitle").textContent = title;
  document.getElementById("modalDescription").textContent = desc;
  document.getElementById("modalImg").src = img;
  document.getElementById("movieModal").style.display = "flex";
}
function closeModal() {
  document.getElementById("movieModal").style.display = "none";
}

function openAddModal() {
  document.getElementById("addModal").style.display = "flex";
}
function closeAddModal() {
  document.getElementById("addModal").style.display = "none";
}

function openWarnModal() {
  document.getElementById("warnModal").style.display = "flex";
}

function closeWarnModal(warnDetail) {
  document.getElementById("warnModal").style.display = "none";
}

async function updatePosterData() {
  await getPosters().then((arr) => {
    console.log(arr);
    posterData = arr;
  });
  render();
}

isLoggedIn(
  () => {
    document.querySelector("#current-logged-in-ac").innerHTML =
      auth.currentUser.displayName;
    // 로그인 이후 현재 유저의 이메일이 허용된 이메일 배열에 포함되어있는지 검사
    if (allowedEmailArr.includes(auth.currentUser.email)) {
      document.querySelector(".reserve-btn").classList.remove("unabled");
      document.querySelector(".reserve-btn").classList.add("enabled");
    }
  },
  () => {
    window.location.assign("/pages/loginPage.html");
  }
);

document
  .querySelector("#add-poster-btn")
  .addEventListener("click", async (event) => {
    event.preventDefault();
    const title = document.getElementById("newTitle").value.trim();
    const badge = document.getElementById("newBadge").value.trim();
    const meta = document.getElementById("newMeta").value.trim();
    const img =
      document.getElementById("newImg").value.trim() ||
      "https://via.placeholder.com/380x540";
    const desc = document.getElementById("newDesc").value.trim();
    const category = document.getElementById("newCategory").value;
    if (!title || !category) return;

    closeAddModal();
    try {
      await addPoster({
        badge: badge,
        category: category,
        desc: desc,
        img: img,
        meta: meta,
        title: title,
      });
    } catch (err) {
      console.err(err);
    } finally {
      window.location.reload();
    }
  });

renderCategories();
updatePosterData();
