const CARD_SELECTOR = [
  ".jobs-search-results__list-item",
  ".scaffold-layout__list-item",
  "li[data-occludable-job-id]"
].join(", ");

const CARD_TITLE_SELECTOR = [
  ".job-card-list__title",
  ".job-card-container__link",
  "a.job-card-container__link"
].join(", ");

const CARD_COMPANY_SELECTOR = [
  ".artdeco-entity-lockup__subtitle",
  ".job-card-container__company-name",
  ".job-card-container__primary-description"
].join(", ");

const CARD_LOCATION_SELECTOR = [
  ".job-card-container__metadata-item",
  ".artdeco-entity-lockup__caption"
].join(", ");

const DETAIL_TITLE_SELECTOR = [
  ".job-details-jobs-unified-top-card__job-title",
  "h1"
].join(", ");

const DETAIL_COMPANY_SELECTOR = [
  ".job-details-jobs-unified-top-card__company-name",
  ".job-details-jobs-unified-top-card__company-name a"
].join(", ");

const DETAIL_LOCATION_SELECTOR = [
  ".job-details-jobs-unified-top-card__primary-description-container",
  ".job-details-jobs-unified-top-card__bullet"
].join(", ");

const DETAIL_DESCRIPTION_SELECTOR = [
  ".jobs-description__content",
  ".jobs-box__html-content",
  ".jobs-description-content__text",
  ".show-more-less-html__markup"
].join(", ");

let scanInFlight = false;

function normalizeWhitespace(value) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function textFrom(root, selector) {
  return normalizeWhitespace(root?.querySelector(selector)?.textContent || "");
}

function containsAny(text, keywords) {
  const haystack = text.toLowerCase();
  return keywords.some((keyword) => haystack.includes(keyword.toLowerCase()));
}

function createDedupeKey(job) {
  return [
    job.title || "",
    job.company || "",
    job.location || "",
    job.url || ""
  ]
    .join("|")
    .toLowerCase();
}

function parseYearsRequirement(description) {
  const match = description.match(/(\d+)\+?\s+years?/i);
  return match ? Number(match[1]) : null;
}

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function readExtensionState() {
  return chrome.runtime.sendMessage({ type: "BAG_THE_GOOSE_GET_STATE" });
}

async function patchState(patch, log, increments) {
  return chrome.runtime.sendMessage({
    type: "BAG_THE_GOOSE_STATE_PATCH",
    patch,
    log,
    increments
  });
}

async function markComplete() {
  return chrome.runtime.sendMessage({ type: "BAG_THE_GOOSE_SCAN_COMPLETE" });
}

async function uploadJob(job, prefilter) {
  return chrome.runtime.sendMessage({
    type: "BAG_THE_GOOSE_UPLOAD_JOB",
    job,
    prefilter
  });
}

function getCards() {
  return Array.from(document.querySelectorAll(CARD_SELECTOR)).filter((card) => {
    const title = textFrom(card, CARD_TITLE_SELECTOR);
    return Boolean(title);
  });
}

function extractCardSummary(card) {
  const link = card.querySelector("a[href*='/jobs/view/']");
  const title = textFrom(card, CARD_TITLE_SELECTOR);
  const company = textFrom(card, CARD_COMPANY_SELECTOR);
  const location = textFrom(card, CARD_LOCATION_SELECTOR);
  const href = link?.href || "";
  const jobId =
    card.getAttribute("data-occludable-job-id") ||
    card.dataset.jobId ||
    href.match(/\/jobs\/view\/(\d+)/)?.[1] ||
    null;

  return {
    title,
    company,
    location,
    url: href || window.location.href,
    jobId
  };
}

function evaluateCard(summary, profile, seenKeys) {
  const combined = `${summary.title} ${summary.company} ${summary.location}`.toLowerCase();
  const reasons = [];
  let decision = "deep_extract";
  let score = 0.5;

  const dedupeKey = createDedupeKey(summary);

  if (seenKeys.has(dedupeKey)) {
    reasons.push("duplicate");
    decision = "reject";
  }

  if (profile.blockedCompanies.length && containsAny(summary.company, profile.blockedCompanies)) {
    reasons.push("blocked_company");
    decision = "reject";
  }

  if (profile.blockedLocations.length && containsAny(summary.location, profile.blockedLocations)) {
    reasons.push("blocked_location");
    decision = "reject";
  }

  if (profile.allowedLocations.length && !containsAny(summary.location, profile.allowedLocations)) {
    reasons.push("location_ambiguous");
    if (decision !== "reject") {
      decision = "deep_extract";
      score -= 0.1;
    }
  } else {
    score += 0.1;
  }

  if (containsAny(summary.title, profile.blockedSeniorityKeywords)) {
    reasons.push("seniority_blocked");
    decision = "reject";
  }

  if (containsAny(summary.title, profile.blockedTitleKeywords)) {
    reasons.push("title_blocked");
    decision = "reject";
  }

  if (containsAny(summary.title, profile.desiredRoleKeywords)) {
    reasons.push("title_matched");
    score += 0.2;
  } else {
    reasons.push("title_ambiguous");
    score -= 0.05;
  }

  if (!summary.title || !summary.company) {
    reasons.push("missing_card_fields");
    decision = "reject";
  }

  return {
    decision,
    reasons,
    score: Math.max(0, Math.min(1, score)),
    dedupeKey
  };
}

async function openCard(card) {
  card.scrollIntoView({ behavior: "smooth", block: "center" });
  await sleep(500);

  const clickable = card.querySelector("a[href*='/jobs/view/']") || card;
  clickable.click();
  await sleep(1400);
}

async function expandDescription() {
  const button = Array.from(document.querySelectorAll("button")).find((element) => {
    const label = normalizeWhitespace(element.textContent || "").toLowerCase();
    return label.includes("show more") || label.includes("see more");
  });

  if (button) {
    button.click();
    await sleep(400);
  }
}

function extractDetail(summary) {
  const title = textFrom(document, DETAIL_TITLE_SELECTOR) || summary.title;
  const company = textFrom(document, DETAIL_COMPANY_SELECTOR) || summary.company;
  const location = textFrom(document, DETAIL_LOCATION_SELECTOR) || summary.location;
  const description = textFrom(document, DETAIL_DESCRIPTION_SELECTOR);
  const canonicalUrl =
    document.querySelector("a[href*='/jobs/view/']")?.href ||
    summary.url ||
    window.location.href;

  return {
    title,
    company,
    location,
    description,
    url: canonicalUrl
  };
}

function evaluateDescription(job, profile, cardEvaluation) {
  const reasons = [...cardEvaluation.reasons];
  let decision = "upload";
  let score = cardEvaluation.score;
  const description = (job.description || "").toLowerCase();

  if (!description) {
    reasons.push("missing_description");
    score -= 0.1;
  }

  if (containsAny(description, profile.blockedDegreeKeywords)) {
    reasons.push("degree_blocked");
    decision = "reject";
  }

  if (containsAny(description, profile.blockedVisaKeywords)) {
    reasons.push("visa_blocked");
    decision = "reject";
  }

  if (containsAny(description, profile.blockedSkillRequirements)) {
    reasons.push("skill_blocked");
    decision = "reject";
  }

  if (containsAny(description, profile.blockedSeniorityKeywords)) {
    reasons.push("seniority_blocked_description");
    decision = "reject";
  }

  const yearsRequirement = parseYearsRequirement(description);
  if (
    yearsRequirement !== null &&
    Number.isFinite(profile.minimumYearsAllowed) &&
    yearsRequirement > profile.minimumYearsAllowed
  ) {
    reasons.push("years_requirement_blocked");
    decision = "reject";
  }

  if (containsAny(description, profile.desiredRoleKeywords)) {
    reasons.push("description_matched");
    score += 0.15;
  }

  return {
    decision,
    reasons,
    score: Math.max(0, Math.min(1, score)),
    dedupeKey: createDedupeKey(job),
    yearsRequirement
  };
}

async function scanLinkedInJobs() {
  if (scanInFlight) {
    return;
  }

  scanInFlight = true;

  try {
    const initial = await readExtensionState();
    const state = initial?.state || {};
    const profile = initial?.profile || {};
    const seenKeys = new Set(state.seenJobKeys || []);
    const cards = getCards();

    await patchState(
      {
        currentPage: window.location.href,
        status: "extracting",
        running: true
      },
      { level: "info", message: `Found ${cards.length} job cards on page.` }
    );

    for (const card of cards) {
      const summary = extractCardSummary(card);

      await patchState(null, null, { scanned: 1 });

      const cardEvaluation = evaluateCard(summary, profile, seenKeys);

      if (cardEvaluation.decision === "reject") {
        await patchState(
          null,
          {
            level: "info",
            message: `Skipped ${summary.title || "unknown role"}: ${cardEvaluation.reasons.join(", ")}`
          },
          { skipped: 1 }
        );
        continue;
      }

      await patchState(
        null,
        {
          level: "info",
          message: `Opening ${summary.title} at ${summary.company}.`
        },
        { shortlisted: 1 }
      );

      await openCard(card);
      await expandDescription();

      const detail = extractDetail(summary);

      await patchState(null, null, { deepExtracted: 1 });

      const descriptionEvaluation = evaluateDescription(detail, profile, cardEvaluation);

      if (descriptionEvaluation.decision === "reject") {
        await patchState(
          null,
          {
            level: "info",
            message: `Rejected ${detail.title}: ${descriptionEvaluation.reasons.join(", ")}`
          },
          { skipped: 1 }
        );
        continue;
      }

      const uploadResponse = await uploadJob(detail, descriptionEvaluation);
      if (uploadResponse?.ok) {
        seenKeys.add(descriptionEvaluation.dedupeKey);
      } else {
        await patchState(
          null,
          {
            level: "error",
            message: uploadResponse?.error || `Failed to upload ${detail.title}.`
          },
          { errors: 1 }
        );
      }
    }

    await markComplete();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown scan error.";
    await patchState(
      {
        status: "error",
        running: false,
        lastError: message
      },
      { level: "error", message },
      { errors: 1 }
    );
  } finally {
    scanInFlight = false;
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "BAG_THE_GOOSE_RUN_SCAN") {
    void scanLinkedInJobs().then(() => {
      sendResponse({ ok: true });
    });
    return true;
  }

  if (message?.type === "BAG_THE_GOOSE_PING") {
    sendResponse({ ok: true, page: window.location.href });
    return false;
  }

  return false;
});
