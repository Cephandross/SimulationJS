// hexify-sharp.js
const fs    = require('fs')
const path  = require('path')
const sharp = require('sharp')

const SRC       = 16
const OUT_SIZE  = 64
const R         = OUT_SIZE/2
const H         = Math.sqrt(3)/2 * R
const IN_DIR    = path.join(__dirname, 'assets')
const OUT_DIR   = path.join(IN_DIR, 'hex_tiles')

const maskSvg = `
<svg width="${OUT_SIZE}" height="${OUT_SIZE}">
  <polygon points="
    ${R+R},${R}
    ${R+R/2},${R+H}
    ${R-R/2},${R+H}
    ${R-R},${R}
    ${R-R/2},${R-H}
    ${R+R/2},${R-H}
  " fill="white"/>
</svg>`

async function processSheet(file, maskBuffer) {
  const srcPath = path.join(IN_DIR, file)
  const meta    = await sharp(srcPath).metadata()
  const base    = path.parse(file).name
  const target  = path.join(OUT_DIR, base)
  fs.mkdirSync(target, { recursive: true })

  if (meta.width < SRC || meta.height < SRC) {
    console.log(`skipping ${file}: smaller than ${SRC}`)
    return
  }

  if (meta.width === SRC && meta.height === SRC) {
    const buf = await sharp(srcPath)
      .resize(OUT_SIZE, OUT_SIZE)
      .composite([{ input: maskBuffer, blend: 'dest-in' }])
      .png()
      .toBuffer()
    fs.writeFileSync(path.join(target, `${base}_0_0_hex.png`), buf)
    return
  }

  const cols = Math.floor(meta.width  / SRC)
  const rows = Math.floor(meta.height / SRC)

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const buf = await sharp(srcPath)
        .extract({ left: x*SRC, top: y*SRC, width: SRC, height: SRC })
        .resize(OUT_SIZE, OUT_SIZE)
        .composite([{ input: maskBuffer, blend: 'dest-in' }])
        .png()
        .toBuffer()
      const name = `${base}_${y}_${x}_hex.png`
      fs.writeFileSync(path.join(target, name), buf)
    }
  }
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  const maskBuffer = await sharp(Buffer.from(maskSvg))
    .resize(OUT_SIZE, OUT_SIZE)
    .png()
    .toBuffer()

  const files = fs.readdirSync(IN_DIR).filter(f => f.endsWith('.png'))
  for (const file of files) {
    try {
      await processSheet(file, maskBuffer)
      console.log(`processed ${file}`)
    } catch (e) {
      console.error(`${file} error: ${e.message}`)
    }
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
