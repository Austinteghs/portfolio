import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

const BASE_URL = 'https://www.datascienceportfol.io';
const PORTFOLIO_URL = `${BASE_URL}/Eghosa_osayame`;

async function fetchHtml(url) {
  const response = await fetch(url);
  return await response.text();
}

function getTemplate(title, contentHtml, linksHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} | Project Case Study</title>
  
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=JetBrains+Mono:wght@400;700&family=Space+Grotesk:wght@400;700&display=swap" rel="stylesheet">
  
  <link rel="stylesheet" href="/src/style.css" />
  <style>
    /* Specific styles for the project detail page */
    .project-header { margin-top: 100px; padding: var(--section-padding) 0 4rem 0; text-align: center; }
    .project-body { max-width: 900px; margin: 0 auto; padding-bottom: var(--section-padding); font-size: 1.1rem; }
    .project-body p { margin-bottom: 1.5rem; color: var(--text-secondary); }
    .project-body h1, .project-body h2, .project-body h3 { margin-top: 2rem; margin-bottom: 1rem; color: #fff; }
    .project-body img { max-width: 100%; height: auto; border-radius: 8px; margin: 2rem 0; border: 1px solid var(--border-color); }
    .project-body iframe { width: 100%; height: 600px; border: none; border-radius: 8px; margin: 2rem 0; }
    .project-links { margin-top: 3rem; display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
    .back-btn { margin-bottom: 2rem; display: inline-flex; align-items: center; }
  </style>
</head>
<body class="dark-theme">
  <!-- Custom Cursor -->
  <div class="cursor-dot" id="cursor-dot"></div>
  <div class="cursor-outline" id="cursor-outline"></div>

  <!-- Navbar -->
  <nav class="navbar gsap-fade-in">
    <div class="container nav-content">
      <a href="/" class="logo">EGHOSA<span class="accent">_</span></a>
      <ul class="nav-links">
        <li><a href="/#about">About</a></li>
        <li><a href="/#experience">Experience</a></li>
        <li><a href="/#projects">Work</a></li>
        <li><a href="/#contact" class="btn btn-outline">Let's Talk</a></li>
      </ul>
    </div>
  </nav>

  <div class="container project-header gsap-fade-up">
    <a href="/#projects" class="back-btn btn-ghost">← Back to Projects</a>
    <h1 class="project-title">${title}</h1>
  </div>

  <div class="container project-body gsap-fade-up delay-1">
    ${contentHtml}
    
    <div class="project-links">
      ${linksHtml}
    </div>
  </div>

  <footer class="footer">
    <div class="container">
      <div class="footer-content">
        <p class="footer-copy">&copy; 2026 Eghosa Osayame. Built with intention.</p>
        <div class="footer-links">
          <a href="https://www.linkedin.com/in/eghosa-osayame-b8b769140/" target="_blank">LinkedIn</a>
          <a href="https://github.com/Austinteghs" target="_blank">GitHub</a>
          <a href="mailto:eghosa.osayame@yahoo.com">Email</a>
        </div>
      </div>
    </div>
  </footer>

  <script type="module" src="/src/main.js"></script>
</body>
</html>`;
}

async function scrape() {
  console.log('Fetching main portfolio page...');
  const mainHtml = await fetchHtml(PORTFOLIO_URL);
  const mainDom = new JSDOM(mainHtml);
  const document = mainDom.window.document;

  // Find the projects section
  const projectCards = document.querySelectorAll('a[href^="/Eghosa_osayame/projects/"]');
  const uniqueProjectUrls = [...new Set(Array.from(projectCards).map(a => a.href))];
  
  console.log(`Found ${uniqueProjectUrls.length} unique projects.`);

  if (!fs.existsSync('./projects')) {
    fs.mkdirSync('./projects');
  }

  let indexHtmlCards = '';

  for (const urlPath of uniqueProjectUrls) {
    const fullUrl = BASE_URL + urlPath;
    console.log(`Scraping project: ${fullUrl}`);
    
    const projectId = urlPath.split('/').pop();
    const projHtml = await fetchHtml(fullUrl);
    const projDom = new JSDOM(projHtml);
    const projDoc = projDom.window.document;
    
    // Attempt to extract title
    const titleEl = projDoc.querySelector('h1, h2, h3');
    const title = titleEl ? titleEl.textContent.trim() : `Project ${projectId}`;

    // On the detailed page, there is a main content area.
    // The structure usually has a container with text, images, or iframes.
    // In datascienceportfol.io, the content is usually in a div that isn't the sidebar.
    // We'll extract all <p>, <img>, <iframe>, and lists from the main body.
    // It's sometimes hard to isolate perfectly, so we grab the largest text container.
    // Since we know the layout of datascienceportfol.io (Tailwind grid), let's find the main content block.
    
    const allDivs = projDoc.querySelectorAll('div');
    let mainContentDiv = null;
    let maxContentLength = 0;
    
    // A heuristic: the div with the most paragraph text is the main content.
    allDivs.forEach(div => {
      // Ignore nav, header, sidebar based on simple heuristic
      if(div.id === 'mobile-menu' || div.classList.contains('sticky') || div.classList.contains('nav')) return;
      
      const pTags = div.querySelectorAll('p');
      let textLength = 0;
      pTags.forEach(p => textLength += p.textContent.length);
      
      if (textLength > maxContentLength) {
        maxContentLength = textLength;
        mainContentDiv = div;
      }
    });

    let extractedContent = '';
    let embeddedLinks = '';
    
    // We will extract paragraphs, images, and iframes from mainContentDiv (or fallback to body)
    const rootSearch = mainContentDiv || projDoc.body;
    
    const elements = rootSearch.querySelectorAll('p, img, iframe, h2, h3, ul, ol');
    elements.forEach(el => {
      // Don't grab small ui elements like "Read more" or empty paragraphs
      if (el.tagName === 'P') {
        const text = el.textContent.trim();
        if(text.length > 10 && !text.includes('Built with datascienceportfol.io')) {
          extractedContent += `<p>${text}</p>\n`;
        }
      } else if (el.tagName === 'IMG') {
        const src = el.getAttribute('src');
        // skip small icons
        if(src && !src.includes('svg') && !src.includes('avatar')) {
          // If it's a relative link, make it absolute
          const fullSrc = src.startsWith('/') ? BASE_URL + src : src;
          extractedContent += `<img src="${fullSrc}" alt="Project image" />\n`;
        }
      } else if (el.tagName === 'IFRAME') {
        extractedContent += el.outerHTML + '\n';
      } else if (el.tagName === 'H2' || el.tagName === 'H3') {
         const text = el.textContent.trim();
         if(text.length > 2 && text !== title) {
           extractedContent += `<h3>${text}</h3>\n`;
         }
      } else if (el.tagName === 'UL' || el.tagName === 'OL') {
         // get lis
         const lis = Array.from(el.querySelectorAll('li')).map(li => `<li>${li.textContent.trim()}</li>`).join('');
         if(lis) {
           extractedContent += `<ul>${lis}</ul>\n`;
         }
      }
    });

    // Grab any external links (github, medium, etc) that might be in the project buttons
    const links = projDoc.querySelectorAll('a[target="_blank"]');
    links.forEach(a => {
      const href = a.getAttribute('href');
      const text = a.textContent.trim() || 'Link';
      if(href && !href.includes('linkedin.com') && !href.includes('datascienceportfol.io')) {
        embeddedLinks += `<a href="${href}" target="_blank" class="btn btn-outline">${text}</a>\n`;
      }
    });

    const newHtml = getTemplate(title, extractedContent, embeddedLinks);
    fs.writeFileSync(`./projects/${projectId}.html`, newHtml);
    console.log(`Generated ./projects/${projectId}.html`);
    
    // Now get the card details from the main page to build the index.html grid
    // We need the card that corresponds to this urlPath
    const cardEl = Array.from(projectCards).find(a => a.href === urlPath);
    let cardImage = '';
    let cardDesc = '';
    let cardTags = '';
    let cardTitle = title;
    
    if (cardEl) {
      const img = cardEl.querySelector('img');
      if (img) {
        let src = img.getAttribute('src');
        cardImage = src.startsWith('/') ? BASE_URL + src : src;
      }
      
      const pTags = cardEl.querySelectorAll('p');
      if(pTags.length >= 2) {
         cardDesc = pTags[1].textContent.trim();
      }
      
      const buttons = cardEl.querySelectorAll('button');
      buttons.forEach(btn => {
        cardTags += `<span>${btn.textContent.trim()}</span>`;
      });
    }

    indexHtmlCards += `
        <!-- Project ${projectId} -->
        <div class="project-card gsap-scroll-trigger">
          <div class="project-img-wrapper">
            <div class="project-img" style="background: url('${cardImage}') center/cover; background-color: #1e1e1e;"></div>
          </div>
          <div class="project-info">
            <h3 class="project-name">${cardTitle}</h3>
            <p class="project-desc">${cardDesc}</p>
            <div class="project-tags">
              ${cardTags}
            </div>
            <a href="/projects/${projectId}.html" class="project-link">Explore Case Study <span>→</span></a>
          </div>
        </div>
`;
  }

  // Update index.html project-grid
  console.log('Updating index.html...');
  const indexHtmlPath = path.join(process.cwd(), 'index.html');
  let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
  
  const gridStart = indexHtml.indexOf('<div class="project-grid">');
  const sectionEnd = indexHtml.indexOf('</section>', gridStart);
  
  if (gridStart !== -1 && sectionEnd !== -1) {
    const beforeGrid = indexHtml.substring(0, gridStart + '<div class="project-grid">'.length);
    const afterGrid = indexHtml.substring(indexHtml.lastIndexOf('</div>', sectionEnd - 1) + 6); // find closing div of grid
    // Actually simpler: just replace everything between <div class="project-grid"> and the last </div> before </section>
    // To be safe, we can use a regex or string splitting
    const gridEndStr = `      </div>\n    </div>\n  </section>`;
    const beforePart = indexHtml.split('<div class="project-grid">')[0];
    const afterPart = indexHtml.split(gridEndStr)[1];
    
    if (beforePart && afterPart) {
        fs.writeFileSync(indexHtmlPath, beforePart + '<div class="project-grid">\n' + indexHtmlCards + gridEndStr + afterPart);
    }
  }
  
  console.log('Done!');
}

scrape().catch(console.error);
