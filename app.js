(() => {
  const V = window.VILLA;
  const $ = (s, el = document) => el.querySelector(s);
  const cur = (n) => `${V.currency}${n.toLocaleString("en")}`;
  const MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const MON = MONTHS.map((m) => m.slice(0, 3));

  /* ---------- date helpers (UTC so daylight saving never shifts a day) ---------- */
  const iso = (d) => d.toISOString().slice(0, 10);
  const parse = (s) => new Date(s + "T00:00:00Z");
  const addDays = (s, n) => {
    const d = parse(s);
    d.setUTCDate(d.getUTCDate() + n);
    return iso(d);
  };
  const nightsBetween = (a, b) => Math.round((parse(b) - parse(a)) / 864e5);
  const isSaturday = (s) => parse(s).getUTCDay() === 6;
  const pretty = (s) => {
    const d = parse(s);
    return `Sat ${d.getUTCDate()} ${MON[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  };
  const now = new Date();
  const today = iso(
    new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())),
  );
  const OPEN_FROM = V.open.from > today ? V.open.from : today;
  const OPEN_TO = V.open.to;

  const seasonFor = (s) => {
    const md = s.slice(5);
    return V.seasons.find((x) => md >= x.from && md <= x.to) || V.seasons[0];
  };

  const bookedNights = new Set();
  V.booked.forEach(({ from, to }) => {
    for (let d = from; d < to; d = addDays(d, 1)) bookedNights.add(d);
  });
  const isBooked = (s) => bookedNights.has(s);
  const rangeIsFree = (a, b) => {
    for (let d = a; d < b; d = addDays(d, 1)) if (isBooked(d)) return false;
    return true;
  };
  const canArrive = (s) =>
    isSaturday(s) &&
    s >= OPEN_FROM &&
    addDays(s, 7) <= OPEN_TO &&
    rangeIsFree(s, addDays(s, 7));

  /* ---------- simple fills ---------- */
  const f = V.facts;
  $("#heroFacts").innerHTML = [
    [f.guests, "guests"],
    [f.bedrooms, "bedrooms"],
    [f.bathrooms, "bathrooms"],
    [f.pool, "private pool"],
  ]
    .map(([n, l]) => `<li><b>${n}</b>${l}</li>`)
    .join("");

  const longDate = (s) => {
    const d = parse(s);
    return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  };
  const factValues = {
    guests: f.guests,
    checkIn: V.checkIn,
    checkOut: V.checkOut,
    deposit: cur(V.securityDeposit),
    openFrom: longDate(V.open.from),
    openTo: longDate(V.open.to),
  };
  document.querySelectorAll("[data-fact]").forEach((el) => {
    el.textContent = factValues[el.dataset.fact];
  });

  /* ---------- price cards ---------- */
  const fmtRange = (a, b) => {
    const [am, ad] = a.split("-").map(Number),
      [bm, bd] = b.split("-").map(Number);
    return `${ad} ${MON[am - 1]} – ${bd} ${MON[bm - 1]}`;
  };
  const groups = [];
  V.seasons.forEach((s) => {
    let g = groups.find((x) => x.name === s.name);
    if (!g) groups.push((g = { ...s, ranges: [] }));
    g.ranges.push(fmtRange(s.from, s.to));
  });
  const top = Math.max(...groups.map((g) => g.price));
  $("#priceCards").innerHTML = groups
    .map(
      (g) => `
    <div class="price ${g.price === top ? "price--peak" : ""}">
      <p class="price__name">${g.name}</p>
      <p class="price__amount">${cur(g.price)} <small>/ week</small></p>
      ${g.ranges.map((r) => `<p class="price__dates">Arrivals ${r}</p>`).join("")}
      <p class="price__min">Saturday to Saturday</p>
    </div>`,
    )
    .join("");
  $("#priceNotes").innerHTML = [
    `Weekly stays only, Saturday to Saturday. Book as many weeks as you like.`,
    `Check-in Saturday from ${V.checkIn}, check-out Saturday by ${V.checkOut}`,
    V.cleaningFee ? `Final cleaning: ${cur(V.cleaningFee)} per stay` : "",
    V.securityDeposit
      ? `Security deposit: ${cur(V.securityDeposit)}, refundable`
      : "",
    V.touristTaxNote || "",
  ]
    .filter(Boolean)
    .map((t) => `<li>${t}</li>`)
    .join("");

  /* ---------- calendar ---------- */
  const monthStart = (s) =>
    new Date(Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, 1));
  const minView = monthStart(OPEN_FROM);
  const maxView = monthStart(OPEN_TO);
  maxView.setUTCMonth(maxView.getUTCMonth() - 1); // two months shown
  if (maxView < minView) maxView.setTime(minView.getTime());
  let view = new Date(minView);
  let start = null,
    end = null,
    hint = "";

  function renderMonth(base) {
    const y = base.getUTCFullYear(),
      m = base.getUTCMonth();
    const offset = (new Date(Date.UTC(y, m, 1)).getUTCDay() + 6) % 7; // Monday first
    const days = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    let html = `<div class="month"><p class="month__title">${MONTHS[m]} ${y}</p><div class="month__grid">`;
    html += ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]
      .map((d) => `<span class="dow">${d}</span>`)
      .join("");
    html += `<span class="day day--empty"></span>`.repeat(offset);
    for (let d = 1; d <= days; d++) {
      const s = iso(new Date(Date.UTC(y, m, d)));
      const cls = ["day"];
      const nightTaken = isBooked(s),
        prevTaken = isBooked(addDays(s, -1));
      const sat = isSaturday(s);
      let disabled = false,
        label = "&nbsp;";
      if (s < OPEN_FROM || s > OPEN_TO) {
        cls.push("day--closed");
        disabled = true;
      } else if (nightTaken && (prevTaken || !sat)) {
        cls.push("day--booked");
        disabled = true;
      } else if (sat) {
        cls.push("day--sat");
        if (nightTaken)
          cls.push("day--in"); // a booking starts: you can leave this day
        else if (prevTaken) cls.push("day--out"); // a booking ends: you can arrive this day
        if (canArrive(s)) label = cur(seasonFor(s).price);
      } else {
        cls.push("day--weekday");
        if (prevTaken) cls.push("day--out");
      }
      if (start && s === start) cls.push("day--start");
      if (end && s === end) cls.push("day--end");
      if (start && end && s > start && s < end) cls.push("day--range");
      html += `<button type="button" class="${cls.join(" ")}" data-date="${s}" ${disabled ? "disabled" : ""}
        aria-label="${s}${nightTaken ? ", booked" : ""}">${d}<small>${label}</small></button>`;
    }
    return html + "</div></div>";
  }

  function renderCalendar() {
    const next = new Date(
      Date.UTC(view.getUTCFullYear(), view.getUTCMonth() + 1, 1),
    );
    $("#calMonths").innerHTML = renderMonth(view) + renderMonth(next);
    $("#calPrev").disabled = view <= minView;
    $("#calNext").disabled = view >= maxView;
  }

  $("#calMonths").addEventListener("click", (e) => {
    const btn = e.target.closest(".day[data-date]");
    if (!btn || btn.disabled) return;
    const s = btn.dataset.date;
    hint = "";
    if (!isSaturday(s)) {
      hint = "Stays run Saturday to Saturday. Please click a Saturday.";
    } else if (start && s > start && rangeIsFree(start, s)) {
      end = s; // extend (or shorten) the stay
    } else if (canArrive(s)) {
      start = s;
      end = addDays(s, 7); // new stay, one week by default
    } else if (start && s > start) {
      hint = "Some of those weeks are already booked.";
    } else {
      hint = "That week is not available.";
    }
    renderCalendar();
    renderSummary();
  });
  $("#summary").addEventListener("click", (e) => {
    if (e.target.id !== "clearDates") return;
    start = end = null;
    hint = "";
    renderCalendar();
    renderSummary();
  });
  $("#calPrev").onclick = () => {
    view.setUTCMonth(view.getUTCMonth() - 1);
    renderCalendar();
  };
  $("#calNext").onclick = () => {
    view.setUTCMonth(view.getUTCMonth() + 1);
    renderCalendar();
  };

  /* ---------- price summary ---------- */
  function quote() {
    if (!start || !end) return null;
    const weeks = nightsBetween(start, end) / 7;
    const lines = {};
    for (let w = start; w < end; w = addDays(w, 7)) {
      const se = seasonFor(w);
      const k = `${se.name}|${se.price}`;
      lines[k] = (lines[k] || 0) + 1;
    }
    const rent = Object.entries(lines).reduce(
      (t, [k, n]) => t + n * Number(k.split("|")[1]),
      0,
    );
    return { weeks, lines, rent, total: rent + (V.cleaningFee || 0) };
  }

  function renderSummary() {
    const el = $("#summary");
    const hintHtml = hint ? `<p class="summary__warn">${hint}</p>` : "";
    if (!start) {
      el.innerHTML = `<p class="muted">Click an arrival Saturday in the calendar to see your price.</p>${hintHtml}`;
      return;
    }
    const q = quote();
    el.innerHTML = `
      <p class="summary__dates">${pretty(start)} → ${pretty(end)} · ${q.weeks} week${q.weeks > 1 ? "s" : ""}</p>
      ${Object.entries(q.lines)
        .map(([k, n]) => {
          const [name, price] = k.split("|");
          return `<p class="summary__line"><span>${n} × ${cur(+price)} (${name.toLowerCase()})</span><span>${cur(n * price)}</span></p>`;
        })
        .join("")}
      ${V.cleaningFee ? `<p class="summary__line"><span>Final cleaning</span><span>${cur(V.cleaningFee)}</span></p>` : ""}
      <p class="summary__total"><span>Total</span><span>${cur(q.total)}</span></p>
      <p class="tiny muted" style="margin-top:6px">Want to stay longer? Click a later Saturday. <button type="button" class="link-btn" id="clearDates">Change dates</button></p>
      ${hintHtml}`;
  }

  /* ---------- booking request ---------- */
  const form = $("#requestForm");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = $("#formError");
    const data = Object.fromEntries(new FormData(form));
    const q = quote();
    const guests = (+data.adults || 0) + (+data.children || 0);
    const problem = !q
      ? "Please choose your arrival Saturday in the calendar."
      : guests > f.guests
        ? `The villa sleeps up to ${f.guests} guests.`
        : !data.name.trim()
          ? "Please enter your name."
          : !/^\S+@\S+\.\S+$/.test(data.email)
            ? "Please enter a valid email address."
            : !data.consent
              ? "Please accept the privacy policy."
              : "";
    if (problem) {
      err.textContent = problem;
      return;
    }
    err.textContent = "";

    const summary = [
      `Booking request for ${V.name}`,
      `Dates: ${pretty(start)} – ${pretty(end)} (${q.weeks} week${q.weeks > 1 ? "s" : ""})`,
      `Guests: ${data.adults} adults, ${data.children || 0} children`,
      `Quoted total: ${cur(q.total)}${V.cleaningFee ? " (incl. cleaning)" : ""}`,
      `Name: ${data.name}`,
      `Email: ${data.email}`,
      `Phone: ${data.phone || "-"}`,
      ``,
      `Message: ${data.message || "-"}`,
    ].join("\n");

    const btn = form.querySelector("button[type=submit]");
    if (V.formEndpoint) {
      btn.disabled = true;
      btn.textContent = "Sending…";
      try {
        const res = await fetch(V.formEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            ...data,
            arrival: start,
            departure: end,
            weeks: q.weeks,
            total: q.total,
            _subject: `Booking request ${start} – ${end}`,
            summary,
          }),
        });
        if (!res.ok) throw new Error();
      } catch {
        err.textContent = `Sorry, something went wrong. Please email us at ${V.contact.email}.`;
        btn.disabled = false;
        btn.textContent = "Send booking request";
        return;
      }
    } else {
      location.href = `mailto:${V.contact.email}?subject=${encodeURIComponent(`Booking request ${start} – ${end}`)}&body=${encodeURIComponent(summary)}`;
    }
    form.innerHTML = `<div class="form-success"><h3>Thank you, ${data.name.split(" ")[0]}!</h3>
      <p>${V.formEndpoint ? "Your request has been sent." : "Your email app should open with the request ready to send."}
      We'll confirm availability for <b>${pretty(start)} – ${pretty(end)}</b> within 24 hours.</p></div>`;
  });

  /* ---------- contact + footer ---------- */
  const c = V.contact;
  $("#contactLinks").innerHTML = `
    <a href="mailto:${c.email}">✉️ ${c.email}</a>
    <a href="https://wa.me/${c.whatsapp}" target="_blank" rel="noopener">💬 WhatsApp</a>`;
  $("#footAddress").innerHTML = `${c.address}<br>${c.email}<br>${c.phone}`;
  $("#footLegal").innerHTML =
    `<strong>Accommodation</strong><p>${V.legal.category}</p>`;
  $("#year").textContent = now.getFullYear();

  /* ---------- nav ---------- */
  const nav = $("#nav"),
    toggle = $("#navToggle");
  const onScroll = () => nav.classList.toggle("scrolled", scrollY > 40);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  toggle.onclick = () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open);
  };
  $("#navLinks").addEventListener("click", (e) => {
    if (e.target.closest("a")) nav.classList.remove("open");
  });

  /* ---------- gallery + lightbox ---------- */
  const photos = V.gallery;
  const SHOW = 5; // how many photos are shown on the page
  const grid = $("#gallery-grid");
  grid.innerHTML = photos
    .slice(0, SHOW)
    .map((p, i) => {
      const more =
        i === SHOW - 1 && photos.length > SHOW
          ? `<span class="gallery__more">+${photos.length - SHOW}<small>View all ${photos.length} photos</small></span>`
          : "";
      return `<button type="button" class="photo" style="--img:url('${p}')" data-i="${i}" aria-label="Open photo ${i + 1}">${more}</button>`;
    })
    .join("");
  $("#galleryAll").textContent = `View all ${photos.length} photos`;

  const lb = $("#lightbox"),
    lbImg = $(".lightbox__img", lb),
    thumbs = $(".lightbox__thumbs", lb);
  thumbs.innerHTML = photos
    .map(
      (p, i) =>
        `<button type="button" class="photo" style="--img:url('${p}')" data-i="${i}" aria-label="Photo ${i + 1}"></button>`,
    )
    .join("");
  let idx = 0;
  const show = (i) => {
    idx = (i + photos.length) % photos.length;
    lbImg.src = photos[idx];
    lbImg.alt = `Villa Misan photo ${idx + 1}`;
    $(".lightbox__count", lb).textContent = `${idx + 1} / ${photos.length}`;
    [...thumbs.children].forEach((t, j) =>
      t.classList.toggle("active", j === idx),
    );
    const t = thumbs.children[idx];
    thumbs.scrollTo({
      left: t.offsetLeft - thumbs.clientWidth / 2 + t.clientWidth / 2,
      behavior: "smooth",
    });
    [1, -1].forEach((d) => {
      new Image().src = photos[(idx + d + photos.length) % photos.length];
    }); // preload neighbours
  };
  const open = (i) => {
    lb.hidden = false;
    document.body.style.overflow = "hidden";
    show(i);
  };
  const close = () => {
    lb.hidden = true;
    document.body.style.overflow = "";
  };

  grid.addEventListener("click", (e) => {
    const b = e.target.closest("[data-i]");
    if (b) open(+b.dataset.i);
  });
  $("#galleryAll").onclick = () => open(0);
  thumbs.addEventListener("click", (e) => {
    const b = e.target.closest("[data-i]");
    if (b) show(+b.dataset.i);
  });
  $(".lightbox__close", lb).onclick = close;
  $(".lightbox__prev", lb).onclick = () => show(idx - 1);
  $(".lightbox__next", lb).onclick = () => show(idx + 1);
  const stage = $(".lightbox__stage", lb);
  stage.addEventListener("click", (e) => {
    if (e.target === stage || e.target.tagName === "FIGURE") close();
  });
  addEventListener("keydown", (e) => {
    if (lb.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") show(idx - 1);
    if (e.key === "ArrowRight") show(idx + 1);
  });
  let x0 = null; // swipe on phones
  stage.addEventListener(
    "touchstart",
    (e) => {
      x0 = e.touches[0].clientX;
    },
    { passive: true },
  );
  stage.addEventListener("touchend", (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
    x0 = null;
  });

  renderCalendar();
  renderSummary();
})();
