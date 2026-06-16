const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { Readable } = require('stream');

// Disable TLS verification to handle potential SSL issues on client networks
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const ARCHIVE_ROOT = path.join(__dirname, 'Magnetic_Marketing_Archive');
const ERROR_LOG = path.join(__dirname, 'download_errors.log');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

function logError(url, message) {
  const time = new Date().toISOString();
  const logMessage = `[${time}] FAIL: ${url} - Reason: ${message}\n`;
  fs.appendFileSync(ERROR_LOG, logMessage);
  console.error(`  [ERROR] ${message}`);
}

function sanitizeFilename(name) {
  return name.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, ' ').trim();
}

// Ensure base directories exist
if (!fs.existsSync(ARCHIVE_ROOT)) {
  fs.mkdirSync(ARCHIVE_ROOT, { recursive: true });
}

// Human emulation delay (4 to 6 seconds)
async function humanDelay() {
  const ms = Math.floor(Math.random() * (6000 - 4000 + 1) + 4000);
  console.log(`  [Delay] Waiting ${(ms / 1000).toFixed(1)}s for rate-limiting...`);
  await new Promise(r => setTimeout(r, ms));
}

// Download general files (PDF, ZIP, MP3, etc.)
async function downloadFile(url, destFolder, customName = '') {
  try {
    const urlObj = new URL(url);
    const originalName = path.basename(urlObj.pathname);
    const extension = path.extname(originalName) || '.pdf';
    
    let baseName = customName ? sanitizeFilename(customName) : path.basename(originalName, extension);
    if (!baseName) baseName = 'document';
    
    // Append extension if not present in custom name
    let filename = baseName;
    if (!filename.toLowerCase().endsWith(extension.toLowerCase())) {
      filename += extension;
    }
    
    const destPath = path.join(destFolder, filename);
    
    console.log(`  [Downloading File] ${url} -> ${destPath}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }
    
    const fileStream = fs.createWriteStream(destPath);
    const body = Readable.fromWeb(response.body);
    body.pipe(fileStream);
    
    await new Promise((resolve, reject) => {
      fileStream.on('finish', resolve);
      fileStream.on('error', reject);
    });
    
    console.log(`  [Success] File downloaded: ${filename}`);
  } catch (err) {
    logError(url, `File download failed: ${err.message}`);
  }
}

// Parse Vimeo configs for MP4 links
function getMp4FromVimeoConfig(config) {
  try {
    const progressive = config.request?.files?.progressive;
    if (progressive && progressive.length > 0) {
      progressive.sort((a, b) => (b.width || 0) - (a.width || 0));
      return progressive[0].url;
    }
  } catch (err) {
    console.log(`  [Vimeo Config Parse Error] ${err.message}`);
  }
  try {
    const hls = config.request?.files?.hls?.default?.url;
    if (hls) return hls;
  } catch (err) {}
  return null;
}

// Parse Wistia configs for MP4 links
function getMp4FromWistiaConfig(config) {
  try {
    const assets = config.media?.assets;
    if (assets && assets.length > 0) {
      const mp4s = assets.filter(a => a.type && (a.type.includes('mp4') || a.url.includes('.mp4') || a.url.includes('.bin')));
      if (mp4s.length > 0) {
        mp4s.sort((a, b) => (b.width || 0) - (a.width || 0));
        return mp4s[0].url;
      }
    }
  } catch (err) {
    console.log(`  [Wistia Config Parse Error] ${err.message}`);
  }
  return null;
}

// Fallback fetchers if configs are not intercepted
async function getVimeoVideoUrlFallback(iframeUrl) {
  try {
    const match = iframeUrl.match(/video\/(\d+)/);
    if (match) {
      const videoId = match[1];
      const urlObj = new URL(iframeUrl);
      const hash = urlObj.searchParams.get('h');
      const configUrl = `https://player.vimeo.com/video/${videoId}/config` + (hash ? `?h=${hash}` : '');
      
      const res = await fetch(configUrl);
      if (res.ok) {
        const config = await res.json();
        return getMp4FromVimeoConfig(config);
      }
    }
  } catch (err) {
    console.log(`  [Vimeo Fallback Failed] ${err.message}`);
  }
  return null;
}

async function getWistiaVideoUrlFallback(iframeUrlOrId) {
  try {
    let wistiaId = '';
    if (iframeUrlOrId.startsWith('http')) {
      const match = iframeUrlOrId.match(/medias\/([a-zA-Z0-9]+)/);
      if (match) wistiaId = match[1];
    } else {
      wistiaId = iframeUrlOrId;
    }
    
    if (wistiaId) {
      const configUrl = `https://fast.wistia.net/embed/medias/${wistiaId}.json`;
      const res = await fetch(configUrl);
      if (res.ok) {
        const config = await res.json();
        return getMp4FromWistiaConfig(config);
      }
    }
  } catch (err) {
    console.log(`  [Wistia Fallback Failed] ${err.message}`);
  }
  return null;
}

// Custom HLS downloader
async function downloadHLS(m3u8Url, destPath) {
  console.log(`  [HLS Download] Fetching playlist: ${m3u8Url}`);
  let res = await fetch(m3u8Url);
  if (!res.ok) throw new Error(`Playlist fetch failed: ${res.status}`);
  let text = await res.text();
  
  let lines = text.split('\n');
  let mediaPlaylistUrl = m3u8Url;
  
  if (text.includes('#EXT-X-STREAM-INF')) {
    let highestBandwidth = 0;
    let chosenUrl = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('#EXT-X-STREAM-INF')) {
        const bwMatch = line.match(/BANDWIDTH=(\d+)/);
        if (bwMatch) {
          const bw = parseInt(bwMatch[1]);
          let nextUrl = lines[i + 1]?.trim();
          if (nextUrl && !nextUrl.startsWith('#')) {
            if (bw > highestBandwidth) {
              highestBandwidth = bw;
              chosenUrl = nextUrl;
            }
          }
        }
      }
    }
    
    if (chosenUrl) {
      mediaPlaylistUrl = new URL(chosenUrl, m3u8Url).href;
      res = await fetch(mediaPlaylistUrl);
      if (!res.ok) throw new Error(`Media playlist fetch failed: ${res.status}`);
      text = await res.text();
      lines = text.split('\n');
    }
  }
  
  const segmentUrls = [];
  for (let line of lines) {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      segmentUrls.push(new URL(line, mediaPlaylistUrl).href);
    }
  }
  
  if (segmentUrls.length === 0) {
    throw new Error('No TS segments found in playlist.');
  }
  
  console.log(`  [HLS Download] Downloading ${segmentUrls.length} TS segments...`);
  const fileStream = fs.createWriteStream(destPath);
  
  for (let i = 0; i < segmentUrls.length; i++) {
    const segmentUrl = segmentUrls[i];
    let success = false;
    let retries = 3;
    while (retries > 0 && !success) {
      try {
        const segRes = await fetch(segmentUrl);
        if (!segRes.ok) throw new Error(`HTTP ${segRes.status}`);
        const buffer = await segRes.arrayBuffer();
        fileStream.write(Buffer.from(buffer));
        success = true;
      } catch (err) {
        retries--;
        console.log(`  [Segment retry ${3-retries}/3] Failed segment ${i+1}: ${err.message}`);
        if (retries === 0) {
          fileStream.end();
          throw new Error(`Failed to download segment ${i+1} after 3 retries.`);
        }
        await new Promise(r => setTimeout(r, 1500));
      }
    }
    // Tiny delay between segment downloads to prevent TCP congestion
    await new Promise(r => setTimeout(r, 50));
  }
  
  fileStream.end();
  await new Promise((resolve) => fileStream.on('finish', resolve));
  console.log(`  [Success] HLS download complete.`);
}

async function triggerVideoPlay(page) {
  try {
    const playButtonSelectors = [
      'button[aria-label="Play"]',
      '.vjs-play-control',
      '.wistia_embed button',
      'iframe[src*="vimeo"] >>> button[aria-label="Play"]',
      'video'
    ];
    for (const selector of playButtonSelectors) {
      const btn = page.locator(selector).first();
      if (await btn.count() > 0 && await btn.isVisible()) {
        await btn.click();
        console.log(`  [Trigger] Clicked play button: ${selector}`);
        await page.waitForTimeout(2000);
        break;
      }
    }
  } catch (err) {
    // Ignore trigger errors
  }
}

async function main() {
  console.log('====================================================');
  console.log('         MAGNETIC MARKETING RESOURCE ARCHIVER       ');
  console.log('====================================================');
  
  const userDataDir = 'C:\\Users\\Udhayakumar J\\AppData\\Local\\Microsoft\\Edge\\User Data';
  console.log(`Launching using Microsoft Edge profile: ${userDataDir}`);
  
  let context;
  try {
    console.log('Step 1: Attempting to launch Chrome with persistent context...');
    context = await chromium.launchPersistentContext(userDataDir, {
      channel: 'msedge',
      headless: false,
      args: [
        '--profile-directory=Default'
      ],
      viewport: { width: 1280, height: 800 }
    });
    console.log('Step 2: Chrome launched successfully!');
  } catch (err) {
    console.error('\n====================================================');
    console.error('ERROR: Could not open your Google Chrome profile.');
    console.error('This is usually because Google Chrome is currently open.');
    console.error('PLEASE CLOSE ALL GOOGLE CHROME WINDOWS AND RETRY!');
    console.error('====================================================\n');
    throw err;
  }
  
  const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();
  
  // Track network resources
  const interceptedM3u8s = new Set();
  const interceptedMp4s = new Set();
  const vimeoConfigs = [];
  const wistiaConfigs = [];
  
  context.on('response', async response => {
    try {
      const url = response.url();
      const status = response.status();
      
      if (status >= 200 && status < 300) {
        if (url.includes('.m3u8')) {
          interceptedM3u8s.add(url);
        } else if (url.includes('.mp4') && !url.includes('vimeo') && !url.includes('wistia')) {
          interceptedMp4s.add(url);
        } else if (url.includes('vimeo.com/video/') && url.includes('/config')) {
          const json = await response.json();
          vimeoConfigs.push(json);
        } else if ((url.includes('wistia.net') || url.includes('wistia.com')) && url.endsWith('.json')) {
          const json = await response.json();
          wistiaConfigs.push(json);
        }
      }
    } catch (err) {
      // Safe to ignore
    }
  });

  const dashboardUrl = 'https://magneticmarketing.com/courses/magneticmarketing/start-here';
  console.log(`Navigating to target dashboard: ${dashboardUrl}`);
  await page.goto(dashboardUrl);
  
  console.log('\n[WAITING FOR LOGIN] Please log in and solve any MFA, 2FA, or CAPTCHA inside the browser window.');
  console.log('The script will automatically detect when you are fully logged in and the dashboard is loaded...');
  
  let isLoggedIn = false;
  let lastLogTime = 0;
  while (!isLoggedIn) {
    try {
      const currentUrl = page.url();
      const urlObj = new URL(currentUrl);
      const isLoginUrl = urlObj.pathname.includes('/sign_in') || urlObj.pathname.includes('/login') || urlObj.pathname.includes('/wp-login.php');
      const isDashboardUrl = urlObj.pathname.includes('diamond-dashboard') || urlObj.pathname.includes('start-here');
      const hasPasswordField = await page.locator('input[type="password"]').first().isVisible().catch(() => false);
      
      const now = Date.now();
      if (now - lastLogTime > 10000) {
        console.log(`[Status] Current URL: ${currentUrl} | Is Login URL: ${isLoginUrl} | Password Field: ${hasPasswordField}`);
        
        // Save screenshot to disk so user/agent can inspect visually
        const screenshotPath = path.join(__dirname, 'live_screenshot.png');
        await page.screenshot({ path: screenshotPath }).catch(err => {
          console.log(`Failed to write screenshot: ${err.message}`);
        });
        console.log(`[Status] Screenshot updated at: ${screenshotPath}`);
        
        lastLogTime = now;
      }
      
      if (isDashboardUrl && !isLoginUrl && !hasPasswordField) {
        // Look for any indicator that course menu or tabs are loaded
        const hasGoldTab = await page.locator('text="Gold"').first().isVisible().catch(() => false);
        const hasDiamondTab = await page.locator('text="Diamond"').first().isVisible().catch(() => false);
        const hasGettingStarted = await page.locator('text="Getting Started"').first().isVisible().catch(() => false);
        
        if (hasGoldTab || hasDiamondTab || hasGettingStarted) {
          isLoggedIn = true;
          console.log('\n[SUCCESS] Login detected! Dashboard loaded.');
          // Delete live screenshot once logged in to clean up
          const screenshotPath = path.join(__dirname, 'live_screenshot.png');
          if (fs.existsSync(screenshotPath)) {
            fs.unlinkSync(screenshotPath);
          }
          break;
        }
      }
    } catch (err) {
      // Page might be navigating or temporarily detached
    }
    await new Promise(r => setTimeout(r, 2000));
  }

  // Debugging: Print out some page metadata to help diagnose layout if needed
  try {
    const pageDetails = await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5')).map(h => `${h.tagName}: ${h.innerText.trim()}`);
      const visibleLinks = Array.from(document.querySelectorAll('a'))
        .filter(a => {
          const rect = a.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0 && a.innerText.trim();
        })
        .map(a => `Link: "${a.innerText.trim()}" -> ${a.href}`);
      return { headings: headings.slice(0, 15), links: visibleLinks.slice(0, 30) };
    });
    
    console.log('\n--- PAGE LAYOUT DEBUG ---');
    console.log('Headings found:', pageDetails.headings);
    console.log('Sample visible links:', pageDetails.links);
    console.log('-------------------------\n');
  } catch (err) {
    console.log(`Failed to print page debug details: ${err.message}`);
  }

  // Automatic Mode Selection
  let lessonQueue = [];
  const txtPath = path.join(__dirname, 'links.txt');
  
  if (fs.existsSync(txtPath)) {
    console.log(`[Mode] Found links.txt. Loading manual link list...`);
    const lines = fs.readFileSync(txtPath, 'utf8').split('\n');
    let currentModule = 'Manual_Links';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        currentModule = trimmed.substring(1, trimmed.length - 1);
        continue;
      }
      
      lessonQueue.push({
        module: currentModule,
        url: trimmed,
        title: trimmed.split('/').filter(Boolean).pop() || 'lesson'
      });
    }
    console.log(`Loaded ${lessonQueue.length} links from links.txt.`);
  } else {
    console.log(`[Mode] links.txt not found. Auto-scanning the dashboard menu...`);
    
    // Find all categories in the accordion sidebar
    const categories = [
      "Getting Started",
      "Course Library - Whole Enchilada",
      "Magnetic Marketing Search Engine",
      "Ultimate Marketing Machine",
      "Learning Lab"
    ];
    
    for (const cat of categories) {
      console.log(`Looking for accordion header: "${cat}"`);
      // Use case-insensitive exact text or contain matches
      const headerElement = page.locator(`text="${cat}"`).first();
      if (await headerElement.count() > 0) {
        try {
          await headerElement.scrollIntoViewIfNeeded();
          await headerElement.click();
          await page.waitForTimeout(2000); // Wait for expand animation
        } catch (err) {
          console.log(`  Warning: Could not click header for "${cat}": ${err.message}`);
        }
      } else {
        // Try selecting by simple text matches in buttons or headers
        const fallbackElement = page.locator(`text=/${cat}/i`).first();
        if (await fallbackElement.count() > 0) {
          try {
            await fallbackElement.scrollIntoViewIfNeeded();
            await fallbackElement.click();
            await page.waitForTimeout(2000);
          } catch (err) {
            console.log(`  Warning: Could not click fallback header for "${cat}": ${err.message}`);
          }
        }
      }
      
      // Extract links visible after clicking this accordion item
      const links = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('a'));
        return anchors.map(a => ({
          text: a.innerText.trim(),
          href: a.href
        })).filter(item => {
          if (!item.href || item.href.startsWith('javascript:') || item.href.includes('#')) return false;
          
          const href = item.href.toLowerCase();
          const text = item.text.toLowerCase();
          
          if (text.includes('contact') || text.includes('privacy') || text.includes('terms') || text.includes('log out') || text.includes('logout') || text.includes('dashboard')) return false;
          
          return href.includes('/courses/') || href.includes('/lessons/') || href.includes('/topics/') || href.includes('/course/');
        });
      });
      
      links.forEach((l, idx) => {
        if (!lessonQueue.some(q => q.url === l.href)) {
          lessonQueue.push({
            module: cat,
            url: l.href,
            title: l.text || `Lesson_${idx + 1}`
          });
        }
      });
    }
  }
  
  if (lessonQueue.length === 0) {
    console.log('No lesson links detected. Please ensure you are logged in and the dashboard menu is visible.');
    await context.close();
    rl.close();
    return;
  }
  
  console.log(`\nInventory scanned! Ready to process ${lessonQueue.length} lessons.`);
  console.log('Starting sequential downloads...');
  
  for (let i = 0; i < lessonQueue.length; i++) {
    const lesson = lessonQueue[i];
    const moduleDirName = `${String(categoriesOrder(lesson.module)).padStart(2, '0')}_${sanitizeFilename(lesson.module)}`;
    const lessonDirName = `${String(i + 1).padStart(3, '0')}_${sanitizeFilename(lesson.title)}`;
    
    const lessonPath = path.join(ARCHIVE_ROOT, moduleDirName, lessonDirName);
    
    if (!fs.existsSync(lessonPath)) {
      fs.mkdirSync(lessonPath, { recursive: true });
    }
    
    console.log(`\n------------------------------------------------------------`);
    console.log(`[Lesson ${i + 1}/${lessonQueue.length}] ${lesson.title}`);
    console.log(`Category: ${lesson.module}`);
    console.log(`URL: ${lesson.url}`);
    console.log(`Saving to: ${lessonPath}`);
    
    // Clear page buffers for the new lesson
    interceptedM3u8s.clear();
    interceptedMp4s.clear();
    vimeoConfigs.length = 0;
    wistiaConfigs.length = 0;
    
    try {
      await page.goto(lesson.url);
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
      
      // Human emulation delay after page navigation
      await humanDelay();
      
      // Trigger play to activate video network calls
      await triggerVideoPlay(page);
      
      // Extract PDFs, links and embed video details from DOM
      const resources = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a'));
        const pdfs = [];
        links.forEach(a => {
          const href = a.href;
          const text = a.innerText.trim();
          if (!href) return;
          
          const isPdf = href.toLowerCase().endsWith('.pdf');
          const isZip = href.toLowerCase().endsWith('.zip');
          const isAudio = href.toLowerCase().endsWith('.mp3');
          const isDoc = href.toLowerCase().endsWith('.docx') || href.toLowerCase().endsWith('.doc');
          
          const hasDownloadKeyword = href.toLowerCase().includes('download') || text.toLowerCase().includes('download') || text.toLowerCase().includes('pdf') || text.toLowerCase().includes('worksheet') || text.toLowerCase().includes('transcript');
          
          if (isPdf || isZip || isAudio || isDoc || (hasDownloadKeyword && (href.includes('.pdf') || href.includes('.zip') || href.includes('.mp3') || href.includes('.docx')))) {
            pdfs.push({
              name: text || href.split('/').pop() || 'document',
              url: href
            });
          }
        });
        
        const iframes = Array.from(document.querySelectorAll('iframe'));
        const videos = [];
        iframes.forEach(iframe => {
          const src = iframe.src || '';
          if (src.includes('vimeo.com')) {
            videos.push({ url: src, type: 'vimeo' });
          } else if (src.includes('wistia.net') || src.includes('wistia.com')) {
            videos.push({ url: src, type: 'wistia' });
          }
        });
        
        // Find Wistia div class embeds
        const wistiaEmbeds = Array.from(document.querySelectorAll('[class*="wistia_embed"]'));
        wistiaEmbeds.forEach(div => {
          const classes = Array.from(div.classList);
          const asyncClass = classes.find(c => c.startsWith('wistia_async_'));
          if (asyncClass) {
            const wistiaId = asyncClass.replace('wistia_async_', '');
            videos.push({
              url: `https://fast.wistia.net/embed/medias/${wistiaId}`,
              type: 'wistia',
              id: wistiaId
            });
          }
        });
        
        return { pdfs, videos };
      });
      
      // 1. Download Documents/PDFs
      if (resources.pdfs.length > 0) {
        console.log(`  Found ${resources.pdfs.length} files to download.`);
        for (const doc of resources.pdfs) {
          await downloadFile(doc.url, lessonPath, doc.name);
          await humanDelay(); // Rate limit between file downloads
        }
      } else {
        console.log('  No PDF or attachment links found.');
      }
      
      // 2. Resolve and Download Video Stream
      let videoUrl = null;
      let downloadMethod = 'mp4';
      
      // Check network interceptions first (highly reliable)
      if (vimeoConfigs.length > 0) {
        videoUrl = getMp4FromVimeoConfig(vimeoConfigs[0]);
        if (videoUrl) console.log('  [Detected] Vimeo video config intercepted.');
      }
      
      if (!videoUrl && wistiaConfigs.length > 0) {
        videoUrl = getMp4FromWistiaConfig(wistiaConfigs[0]);
        if (videoUrl) console.log('  [Detected] Wistia video config intercepted.');
      }
      
      if (!videoUrl && interceptedM3u8s.size > 0) {
        videoUrl = Array.from(interceptedM3u8s)[0];
        downloadMethod = 'hls';
        console.log('  [Detected] HLS stream (.m3u8) intercepted.');
      }
      
      if (!videoUrl && interceptedMp4s.size > 0) {
        videoUrl = Array.from(interceptedMp4s)[0];
        console.log('  [Detected] Direct MP4 video stream intercepted.');
      }
      
      // Fallback to iframe scraping if network capture missed it
      if (!videoUrl && resources.videos.length > 0) {
        const vid = resources.videos[0];
        console.log(`  [Fallback] Extracting from iframe embed: ${vid.type} (${vid.url})`);
        if (vid.type === 'vimeo') {
          videoUrl = await getVimeoVideoUrlFallback(vid.url);
        } else if (vid.type === 'wistia') {
          videoUrl = await getWistiaVideoUrlFallback(vid.id || vid.url);
        }
      }
      
      // Download the video
      if (videoUrl) {
        const videoFilename = `${sanitizeFilename(lesson.title)}.mp4`;
        const videoDestPath = path.join(lessonPath, videoFilename);
        
        console.log(`  [Downloading Video] Source: ${videoUrl}`);
        if (downloadMethod === 'hls' || videoUrl.includes('.m3u8')) {
          await downloadHLS(videoUrl, videoDestPath);
        } else {
          await downloadFile(videoUrl, lessonPath, sanitizeFilename(lesson.title));
        }
        await humanDelay();
      } else {
        console.log('  No video stream or video embeds found.');
      }
      
    } catch (err) {
      logError(lesson.url, `Failed to scrape page or extract resources: ${err.message}`);
    }
  }
  
  console.log('\n====================================================');
  console.log('             ARCHIVING WORK COMPLETED!              ');
  console.log(`  Check "${ARCHIVE_ROOT}" for downloads.`);
  if (fs.existsSync(ERROR_LOG)) {
    console.log(`  [WARNING] Some downloads failed. Check "${ERROR_LOG}"`);
  }
  console.log('====================================================');
  
  await context.close();
  rl.close();
}

function categoriesOrder(cat) {
  const mapping = {
    "Getting Started": 1,
    "Course Library - Whole Enchilada": 2,
    "Magnetic Marketing Search Engine": 3,
    "Ultimate Marketing Machine": 4,
    "Learning Lab": 5
  };
  return mapping[cat] || 99;
}

main().catch(err => {
  console.error('Unhandled script error:', err);
  rl.close();
});
