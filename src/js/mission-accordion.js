document.addEventListener("DOMContentLoaded", () => {
  const accordionItems = document.querySelectorAll(".mission-accordion-item");

  accordionItems.forEach((item) => {
    const button = item.querySelector(".mission-accordion-button");
    const content = item.querySelector(".mission-accordion-content");

    button.addEventListener("click", () => {
      // Simple toggle:
      const isExpanded = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", !isExpanded);
      content.style.display = isExpanded ? "none" : "block";
    });
  });
});