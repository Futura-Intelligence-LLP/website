const Handlebars = require("handlebars");
const fs = require("fs-extra");
const path = require("path");
const fm = require("front-matter"); // For parsing YAML front-matter
const { marked } = require("marked"); // For converting Markdown to HTML

const config = {
  paths: {
    output: "./static-content",
    templates: {
      header: "./src/templates/header.html",
      footer: "./src/templates/footer.html",
      missionSection: "./src/templates/mission-section.hbs",
      roadmapSection: "./src/templates/roadmap-section.hbs",
    },
    sections: {
      landing: "./src/sections/landing.html",
      vision: "./src/sections/vision.html",
      contact: "./src/sections/contact.html",
      missionDir: "./src/sections/mission",
      roadmapDir: "./src/sections/roadmap",
    },
    assets: {
      css: "./src/css",
      js: "./src/js",
      assets: "./src/assets",
    },
  },
  missions: {
    allowedStatuses: ["Ongoing", "Planned", "Completed"],
  },
};

/**
 * Registers custom Handlebars helpers.
 */
function registerHandlebarsHelpers() {
  Handlebars.registerHelper("math", function (lvalue, operator, rvalue) {
    lvalue = parseFloat(lvalue);
    rvalue = parseFloat(rvalue);
    return {
      "+": lvalue + rvalue,
      "-": lvalue - rvalue,
      "*": lvalue * rvalue,
      "/": lvalue / rvalue,
      "%": lvalue % rvalue,
    }[operator];
  });
}

/**
 * Loads content collections from a directory (e.g., missions, roadmaps).
 * Parses front-matter and converts Markdown body to HTML.
 * @param {string} dirPath - The path to the directory.
 * @returns {Promise<Array<Object>>} - A promise that resolves to an array of content objects.
 */
async function loadContentFromDirectory(dirPath) {
  const files = (await fs.readdir(dirPath)).filter((file) =>
    file.endsWith(".md")
  );

  return Promise.all(
    files.map(async (file) => {
      const filePath = path.join(dirPath, file);
      const rawContent = await fs.readFile(filePath, "utf8");
      const parsed = fm(rawContent);

      // Pre-process body to handle custom spacing comments
      const bodyWithSpacing = parsed.body.replace(
        /<!--\s*spacing:\s*(small|medium|large)\s*-->/g,
        '<div class="spacing-$1"></div>'
      );

      return {
        id: path.parse(file).name,
        ...parsed.attributes,
        // Convert the processed body to HTML
        content: marked(bodyWithSpacing),
      };
    })
  );
}

/**
 * Validates that all missions have a corresponding roadmap.
 * @param {Array<Object>} missions - The array of mission objects.
 * @param {Array<Object>} roadmaps - The array of roadmap objects.
 */
function validateData(missions, roadmaps) {
  const roadmapIds = new Set(roadmaps.map(r => r.id));
  for (const mission of missions) {
    // Validate required front-matter fields
    if (!mission.title || !mission.createdAt || !mission.status || !mission.roadmapId) {
      throw new Error(`Mission '${mission.id}.md' is missing required front-matter fields (title, createdAt, status, roadmapId).`);
    }

    // Enforce status enum
    if (!config.missions.allowedStatuses.includes(mission.status)) {
      throw new Error(`Mission '${mission.id}.md' has an invalid status: '${mission.status}'. Must be one of: ${config.missions.allowedStatuses.join(", ")}.`);
    }

    // Ensure every mission's roadmapId corresponds to a loaded roadmap.
    if (!roadmapIds.has(mission.roadmapId)) {
      throw new Error(`Build failed: Mission "${mission.title}" has an invalid roadmapId: "${mission.roadmapId}". No matching roadmap file was found in '${config.paths.sections.roadmapDir}'.`);
    }
  }

  // Validate roadmap files
  for (const roadmap of roadmaps) {
    if (!roadmap.title || !roadmap.intro || !roadmap.phases || !Array.isArray(roadmap.phases)) {
      throw new Error(`Roadmap '${roadmap.id}.md' is missing required front-matter fields (title, intro, phases).`);
    }
  }
}

/**
 * The main build function that orchestrates the static site generation.
 */
async function main() {
  try {
    registerHandlebarsHelpers();

    console.log("Reading templates and sections...");
    const [
      headerTemplate,
      footerTemplate,
      landingSection,
      visionSection,
      contactSection,
      missionTemplate,
      roadmapTemplate,
      missions,
      roadmaps,
    ] = await Promise.all([
      fs.readFile(config.paths.templates.header, "utf8"),
      fs.readFile(config.paths.templates.footer, "utf8"),
      fs.readFile(config.paths.sections.landing, "utf8"),
      fs.readFile(config.paths.sections.vision, "utf8"),
      fs.readFile(config.paths.sections.contact, "utf8"),
      fs.readFile(config.paths.templates.missionSection, "utf8"),
      fs.readFile(config.paths.templates.roadmapSection, "utf8"),
      loadContentFromDirectory(config.paths.sections.missionDir),
      loadContentFromDirectory(config.paths.sections.roadmapDir),
    ]);

    // --- VALIDATION STEP ---
    console.log("Validating data integrity...");
    validateData(missions, roadmaps);

    // Sort missions by createdAt date, newest first
    missions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Filter missions based on their status
    const activeMissions = missions.filter(m => m.status === 'Ongoing' || m.status === 'Planned');
    const completedMissions = missions.filter(m => m.status === 'Completed');

    const missionSection = Handlebars.compile(missionTemplate)({
      activeMissions,
      completedMissions,
    });

    // Read and compile all roadmap sections
    const compiledRoadmapTemplate = Handlebars.compile(roadmapTemplate);

    const allRoadmapsHtml = roadmaps
      .map((roadmap) => {
        const content = compiledRoadmapTemplate(roadmap);
        return `<section id="${roadmap.id}" class="space-theme roadmap-section">${content}</section>`;
      })
      .join('\n');


    // Create single-page template with all sections
    const indexPageTemplate = `
        ${headerTemplate}
        <main>
            <section id="landing" class="space-theme">${landingSection}</section>
            <section id="vision" class="space-theme">${visionSection}</section>
            <section id="mission" class="space-theme">${missionSection}</section>
            ${allRoadmapsHtml}
            <section id="contact" class="space-theme">${contactSection}</section>
        </main>
        ${footerTemplate}
    `;

    console.log("Creating output directory...");
    await fs.ensureDir(config.paths.output);

    console.log("Building pages...");
    await fs.writeFile(path.join(config.paths.output, "index.html"), indexPageTemplate);

    console.log("Copying assets...");
    await fs.copy(config.paths.assets.css, path.join(config.paths.output, "css"));
    await fs.copy(config.paths.assets.js, path.join(config.paths.output, "js"));
    await fs.copy(config.paths.assets.assets, path.join(config.paths.output, "assets"));

    console.log("Build completed successfully!");
  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
}

main();
