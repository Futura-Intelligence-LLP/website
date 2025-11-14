const Handlebars = require("handlebars");
const fs = require("fs-extra");
const path = require("path");
const fm = require("front-matter"); // For parsing YAML front-matter
const { marked } = require("marked"); // For converting Markdown to HTML

async function build() {
  try {
    // Register a Handlebars helper for basic math in templates
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

    console.log("Reading templates and sections...");
    const headerTemplate = fs.readFileSync(
      "./src/templates/header.html",
      "utf8"
    );
    const footerTemplate = fs.readFileSync(
      "./src/templates/footer.html",
      "utf8"
    );
    const landingSection = fs.readFileSync("./src/sections/landing.html", "utf8");
    const visionSection = fs.readFileSync(
      "./src/sections/vision.html",
      "utf8"
    );
    const contactSection = fs.readFileSync("./src/sections/contact.html", "utf8");

    // Read all mission files from the directory
    const missionDir = "./src/sections/mission";
    const missionFiles = (await fs.readdir(missionDir)).filter(file => file.endsWith('.md'));

    const ALLOWED_STATUSES = ['Ongoing', 'Planned', 'Completed'];

    let missions = await Promise.all(
      missionFiles.map(async (file) => {
        const filePath = path.join(missionDir, file);
        const rawContent = await fs.readFile(filePath, "utf8");
        const parsed = fm(rawContent);

        // Validate front matter
        if (!parsed.attributes.title || !parsed.attributes.createdAt || !parsed.attributes.status || !parsed.attributes.roadmapId) {
          throw new Error(`Mission file '${file}' is missing required front-matter fields (title, createdAt, status, roadmapId).`);
        }

        // Enforce status enum
        if (!ALLOWED_STATUSES.includes(parsed.attributes.status)) {
            throw new Error(`Mission file '${file}' has an invalid status: '${parsed.attributes.status}'. Must be one of: ${ALLOWED_STATUSES.join(', ')}.`);
        }

        return {
          ...parsed.attributes,
          content: marked(parsed.body), // Convert markdown body to HTML
        };
      })
    );

    // Sort missions by createdAt date, newest first
    missions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Filter missions based on their status
    const activeMissions = missions.filter(m => m.status === 'Ongoing' || m.status === 'Planned');
    const completedMissions = missions.filter(m => m.status === 'Completed');

    // Define the template for the entire mission section
    const missionTemplate = `
      <div class="mission-display">
        {{#if activeMissions}}
          <div class="active-missions-carousel">
            <button class="carousel-btn prev-btn" aria-label="Previous Mission"><i class="fas fa-chevron-left"></i></button>
            <div class="active-missions-container carousel-track">
              {{#each activeMissions}}
                <div class="carousel-item">
                  <div class="mission-card">
                    <div class="mission-header">
                      <h2>{{title}}</h2>
                      <span class="status-badge status-{{status}}">{{status}}</span>
                    </div>
                    <div class="mission-content">
                      {{{content}}}
                    </div>
                    <div class="mission-actions">
                      <a href="#{{roadmapId}}" class="roadmap-link-btn">View Project Roadmap</a>
                    </div>
                  </div>
                </div>
              {{/each}}
              </div>
            <button class="carousel-btn next-btn" aria-label="Next Mission"><i class="fas fa-chevron-right"></i></button>
          </div>
        {{/if}}

        {{#if completedMissions}}
          <div class="archived-missions">
            <h3>Archived Missions</h3>
            <div class="archived-missions-list">
              {{#each completedMissions}}
                <div class="archived-mission-item">
                   <button class="archived-mission-button" aria-expanded="false">
                      <h4>{{title}}</h4>
                      <span class="status-badge status-{{status}}">{{status}}</span>
                   </button>
                   <div class="archived-mission-content" style="display: none;">
                      {{{content}}}
                   </div>
                </div>
              {{/each}}
            </div>
          </div>
        {{/if}}
      </div>
    `;
    const missionSection = Handlebars.compile(missionTemplate)({
      activeMissions,
      completedMissions,
    });

    // Read and compile all roadmap sections
    const roadmapDir = "./src/sections/roadmap";
    const roadmapFiles = (await fs.readdir(roadmapDir)).filter(file => file.endsWith('.md'));

    const roadmapTemplate = `
      <div class="roadmap-container">
        <div class="phase-backdrop"></div>
        <h2 class="roadmap-title">{{title}}</h2>
        <p class="roadmap-intro">{{intro}}</p>
        <div class="roadmap-timeline">
            {{#each phases}}
            <div class="timeline-item">
                <!-- Icon is a sibling and always present -->
                <div class="timeline-icon" aria-hidden="true"><i class="fas fa-rocket"></i></div>

                <!-- Connector line from icon to pill -->
                <div class="timeline-connector"></div>

                <!-- Mobile pill + accordion trigger: visible on small screens, toggles accordion -->
                <button class="timeline-trigger" aria-expanded="false">
                    <div class="timeline-pill">
                        <h3 class="timeline-phase-title">{{title}}</h3>
                    </div>
                </button>

                <!-- Content card: modal-style on mobile, visible on desktop -->
                <div class="phase-card">
                  <div class="phase-header">
                    <h3 class="phase-card-title">{{title}}</h3>
                    <button class="phase-close-btn" aria-label="Close phase details" title="Close">
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                  <p class="phase-objective"><strong>Objective:</strong> {{objective}}</p>
                  <span class="phase-duration">{{duration}}</span>
                </div>
            </div>
            {{/each}}
        </div>
      </div>
    `;
    const compiledRoadmapTemplate = Handlebars.compile(roadmapTemplate);

    const roadmapData = {};
    for (const file of roadmapFiles) {
      const roadmapId = path.parse(file).name;
      const rawContent = await fs.readFile(path.join(roadmapDir, file), "utf8");
      const parsed = fm(rawContent);
      roadmapData[roadmapId] = compiledRoadmapTemplate(parsed.attributes);
    }

    // --- VALIDATION STEP ---
    // Ensure every mission's roadmapId corresponds to a loaded roadmap.
    for (const mission of missions) {
      if (!roadmapData[mission.roadmapId]) {
        throw new Error(`Build failed: Mission "${mission.title}" has an invalid roadmapId: "${mission.roadmapId}". No matching roadmap file was found in '${roadmapDir}'.`);
      }
    }

    const allRoadmapsHtml = Object.entries(roadmapData)
      .map(([id, content]) => `<section id="${id}" class="space-theme roadmap-section">${content}</section>`)
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
    await fs.ensureDir("./static-content");

    console.log("Building pages...");
    await fs.writeFile("./static-content/index.html", indexPageTemplate);

    console.log("Copying assets...");
    await fs.copy("./src/css", "./static-content/css");
    await fs.copy("./src/js", "./static-content/js");
    await fs.copy("./src/assets", "./static-content/assets");

    console.log("Build completed successfully!");
  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
}

build();
