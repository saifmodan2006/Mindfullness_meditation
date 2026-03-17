$(function () {
  document.body.classList.add("page-enter");
  requestAnimationFrame(function () {
    document.body.classList.add("page-ready");
  });

  const nav = $(".navbar");
  const prefReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function updateNavbar() {
    if ($(window).scrollTop() > 20) {
      nav.addClass("scrolled");
    } else {
      nav.removeClass("scrolled");
    }
  }

  updateNavbar();
  $(window).on("scroll", updateNavbar);

  $("#year").text(new Date().getFullYear());

  const quotes = [
    "Breathe in calm. Breathe out tension.",
    "Mindfulness is a pause between stimulus and response.",
    "Small moments of stillness create big emotional resilience.",
    "Progress in meditation is measured in awareness, not perfection."
  ];

  let quoteIndex = 0;
  const quoteTarget = $("#dailyQuote");
  if (quoteTarget.length) {
    setInterval(function () {
      quoteIndex = (quoteIndex + 1) % quotes.length;
      quoteTarget.fadeOut(180, function () {
        quoteTarget.text(quotes[quoteIndex]).fadeIn(200);
      });
    }, 5000);
  }

  if (!prefReducedMotion) {
    const heroArt = document.querySelector(".hero-art");
    if (heroArt) {
      document.addEventListener("pointermove", function (event) {
        const x = (event.clientX / window.innerWidth - 0.5) * 10;
        const y = (event.clientY / window.innerHeight - 0.5) * 10;
        heroArt.style.transform = "translate(" + x.toFixed(2) + "px, " + y.toFixed(2) + "px)";
      });
    }
  }

  let timerHandle = null;
  let remaining = 300;

  function renderTimer() {
    const min = Math.floor(remaining / 60)
      .toString()
      .padStart(2, "0");
    const sec = (remaining % 60).toString().padStart(2, "0");
    $("#sessionTimer").text(min + ":" + sec);
  }

  $("#startTimer").on("click", function () {
    if (timerHandle) {
      return;
    }
    timerHandle = setInterval(function () {
      if (remaining > 0) {
        remaining -= 1;
        renderTimer();
      } else {
        clearInterval(timerHandle);
        timerHandle = null;
        alert("Session complete. Great job staying present.");
      }
    }, 1000);
  });

  $("#pauseTimer").on("click", function () {
    clearInterval(timerHandle);
    timerHandle = null;
  });

  $("#resetTimer").on("click", function () {
    clearInterval(timerHandle);
    timerHandle = null;
    remaining = 300;
    renderTimer();
  });

  renderTimer();

  // Reveal blocks as they enter viewport for smoother, meaningful motion.
  const revealNodes = document.querySelectorAll(".reveal");
  if (revealNodes.length) {
    if (prefReducedMotion || !("IntersectionObserver" in window)) {
      revealNodes.forEach(function (node) {
        node.classList.add("in-view");
      });
    } else {
      const revealObserver = new IntersectionObserver(
        function (entries, observer) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("in-view");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.18 }
      );
      revealNodes.forEach(function (node) {
        revealObserver.observe(node);
      });
    }
  }

  function animateCount(el) {
    const target = Number(el.dataset.count || "0");
    const suffix = el.dataset.suffix || "";
    if (!target) {
      return;
    }
    const duration = 1200;
    const startTime = performance.now();

    function tick(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.floor(target * eased);
      el.textContent = value + suffix;
      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    }

    requestAnimationFrame(tick);
  }

  const statNodes = document.querySelectorAll(".stat-number[data-count]");
  if (statNodes.length) {
    if (prefReducedMotion || !("IntersectionObserver" in window)) {
      statNodes.forEach(function (node) {
        node.textContent = node.dataset.count + (node.dataset.suffix || "");
      });
    } else {
      const statObserver = new IntersectionObserver(
        function (entries, observer) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting && !entry.target.dataset.played) {
              entry.target.dataset.played = "true";
              animateCount(entry.target);
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.4 }
      );
      statNodes.forEach(function (node) {
        statObserver.observe(node);
      });
    }
  }

  $(".btn, .card-soft, .filter-btn").on("touchstart pointerdown", function () {
    $(this).addClass("touch-active");
  });

  $(".btn, .card-soft, .filter-btn").on("touchend touchcancel pointerup pointercancel", function () {
    $(this).removeClass("touch-active");
  });

  $(".filter-btn").on("click", function () {
    const category = $(this).data("filter");
    $(".filter-btn").removeClass("active");
    $(this).addClass("active");

    if (category === "all") {
      $(".exercise-card").stop(true, true).fadeIn(180);
      return;
    }
    $(".exercise-card").stop(true, true).fadeOut(120);
    $(".exercise-card[data-category='" + category + "']").stop(true, true).delay(120).fadeIn(180);
  });

  $("#moodForm").on("submit", function (e) {
    e.preventDefault();
    const mood = $("#mood").val();
    const minutes = $("#minutes").val();
    const note = $("#note").val();

    if (!mood || !minutes) {
      $("#trackerMessage").text("Please select mood and minutes.");
      return;
    }

    const record = {
      mood: mood,
      minutes: Number(minutes),
      note: note,
      date: new Date().toLocaleDateString()
    };

    const data = JSON.parse(localStorage.getItem("mindfulRecords") || "[]");
    data.push(record);
    localStorage.setItem("mindfulRecords", JSON.stringify(data));

    $("#trackerMessage").text("Session saved only in this browser.");
    $("#moodForm")[0].reset();
    renderTrackerList();
  });

  function renderTrackerList() {
    const list = $("#trackerList");
    if (!list.length) {
      return;
    }
    const data = JSON.parse(localStorage.getItem("mindfulRecords") || "[]").slice(-6).reverse();
    list.empty();
    if (!data.length) {
      list.append("<li class='list-group-item'>No sessions logged yet.</li>");
      return;
    }
    data.forEach(function (item) {
      list.append(
        "<li class='list-group-item d-flex justify-content-between align-items-start'><div><strong>" +
          item.mood +
          "</strong><br><small class='text-muted'>" +
          item.date +
          "</small><br><span>" +
          (item.note || "No note") +
          "</span></div><span class='badge text-bg-success rounded-pill'>" +
          item.minutes +
          " min</span></li>"
      );
    });
  }

  renderTrackerList();

  function getMoodScore(mood) {
    const map = {
      Calm: 3,
      Focused: 3,
      Tired: 2,
      Anxious: 1
    };
    return map[mood] || 2;
  }

  function getRecentStats(records) {
    const recent = records.slice(-7);
    if (!recent.length) {
      return {
        avgMinutes: 0,
        avgMood: 2,
        anxiousCount: 0,
        streakHint: 0
      };
    }

    let totalMinutes = 0;
    let totalMood = 0;
    let anxiousCount = 0;
    recent.forEach(function (item) {
      totalMinutes += Number(item.minutes || 0);
      totalMood += getMoodScore(item.mood);
      if (item.mood === "Anxious") {
        anxiousCount += 1;
      }
    });

    return {
      avgMinutes: totalMinutes / recent.length,
      avgMood: totalMood / recent.length,
      anxiousCount: anxiousCount,
      streakHint: recent.length
    };
  }

  function predictRiskLevel(input, stats) {
    let riskScore = 0;

    if (input.sleepHours < 6) {
      riskScore += 2;
    } else if (input.sleepHours < 7) {
      riskScore += 1;
    }

    if (input.stressLoad === "high") {
      riskScore += 2;
    } else if (input.stressLoad === "medium") {
      riskScore += 1;
    }

    if (stats.avgMinutes < 6) {
      riskScore += 2;
    } else if (stats.avgMinutes < 10) {
      riskScore += 1;
    }

    if (stats.avgMood < 2) {
      riskScore += 2;
    } else if (stats.avgMood < 2.4) {
      riskScore += 1;
    }

    if (stats.anxiousCount >= 3) {
      riskScore += 2;
    }

    if (riskScore >= 7) {
      return "high";
    }
    if (riskScore >= 4) {
      return "medium";
    }
    return "low";
  }

  function getPlanByGoal(goal, risk) {
    const plan = [];

    if (goal === "focus") {
      plan.push("Start with 4 minutes of box breathing before your first deep-work block.");
      plan.push("Use 25-minute focus cycles with a 2-minute mindful reset between cycles.");
      plan.push("Avoid social notifications during the first two cycles.");
    } else if (goal === "calm") {
      plan.push("Do a 6 to 8 minute anxiety-release guided session first.");
      plan.push("Use longer exhales (4-in, 6-out) for 10 rounds when stress spikes.");
      plan.push("Add one grounding round: 5 things see, 4 feel, 3 hear.");
    } else {
      plan.push("Do a 10-minute body scan in the evening.");
      plan.push("Stop intense screen use 30 minutes before sleep.");
      plan.push("Use gentle breathing: inhale 4, exhale 6 for 3 to 5 minutes in bed.");
    }

    if (risk === "high") {
      plan.push("Keep sessions short but frequent: 3 sessions of 5 minutes instead of one long session.");
    } else if (risk === "medium") {
      plan.push("Target at least 12 mindful minutes total today to stabilize routine.");
    } else {
      plan.push("You are stable today. Add one challenge session to improve consistency.");
    }

    return plan;
  }

  function renderInsightOutput(payload) {
    const target = $("#insightOutput");
    if (!target.length) {
      return;
    }

    const planHtml = payload.plan
      .map(function (item) {
        return "<li>" + item + "</li>";
      })
      .join("");

    target.html(
      "<div class='d-flex justify-content-between flex-wrap gap-2 align-items-center'><h5 class='mb-0'>Predicted Daily Overload Risk</h5><span class='risk-pill " +
        payload.risk +
        "'>" +
        payload.risk.toUpperCase() +
        "</span></div><p class='small text-secondary mt-2 mb-2'>Confidence improves as you log more sessions.</p><div class='row g-2 small mb-2'><div class='col-sm-6'><strong>Recent avg minutes:</strong> " +
        payload.avgMinutes +
        "</div><div class='col-sm-6'><strong>Recent mood score:</strong> " +
        payload.avgMood +
        " / 3</div><div class='col-sm-6'><strong>Anxious entries (last 7):</strong> " +
        payload.anxiousCount +
        "</div><div class='col-sm-6'><strong>Sleep input:</strong> " +
        payload.sleepHours +
        " hrs</div></div><h6 class='mt-3 mb-1'>Recommended Plan</h6><ul class='plan-list'>" +
        planHtml +
        "</ul>"
    );
  }

  $("#insightForm").on("submit", function (e) {
    e.preventDefault();

    const sleepHours = Number($("#sleepHours").val());
    const stressLoad = $("#stressLoad").val();
    const focusTarget = $("#focusTarget").val();

    if (!sleepHours || !stressLoad || !focusTarget) {
      $("#insightStatus").text("Please complete all Smart Wellness Coach fields.");
      return;
    }

    const records = JSON.parse(localStorage.getItem("mindfulRecords") || "[]");
    const stats = getRecentStats(records);
    const risk = predictRiskLevel(
      {
        sleepHours: sleepHours,
        stressLoad: stressLoad,
        focusTarget: focusTarget
      },
      stats
    );

    const payload = {
      risk: risk,
      avgMinutes: stats.avgMinutes.toFixed(1),
      avgMood: stats.avgMood.toFixed(1),
      anxiousCount: stats.anxiousCount,
      sleepHours: sleepHours.toFixed(1),
      plan: getPlanByGoal(focusTarget, risk)
    };

    renderInsightOutput(payload);
    $("#insightStatus").text("Smart plan generated from your recent pattern.");
  });

  $("#contactForm").on("submit", function (e) {
    e.preventDefault();
    const name = $("#name").val().trim();
    const email = $("#email").val().trim();
    const message = $("#message").val().trim();

    if (!name || !email || !message) {
      $("#contactStatus").text("Please fill all required fields.");
      return;
    }
    $("#contactStatus").text("Thank you. Your message has been recorded.");
    this.reset();
  });

  $("a[href^='#']").on("click", function (e) {
    const target = this.getAttribute("href");
    if (target.length > 1 && $(target).length) {
      e.preventDefault();
      document.querySelector(target).scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  $("a[href$='.html']").on("click", function (e) {
    const href = this.getAttribute("href");
    const isModifiedClick = e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0;
    if (!href || href.startsWith("http") || isModifiedClick) {
      return;
    }
    e.preventDefault();
    document.body.classList.remove("page-ready");
    setTimeout(function () {
      window.location.href = href;
    }, 160);
  });
});