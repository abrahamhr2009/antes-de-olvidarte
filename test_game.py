import asyncio, sys
from playwright.async_api import async_playwright

async def main():
    errors = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(args=['--use-gl=angle --use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'])
        page = await browser.new_page(viewport={'width':1280,'height':720})
        page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
        page.on('pageerror', lambda e: errors.append(str(e)))
        await page.goto('http://localhost:5173/?nobloom', wait_until='networkidle')
        await page.wait_for_timeout(4000)
        await page.screenshot(path='/workspace/shots/menu.png')
        # click Nueva partida
        await page.click('[data-act="new"]')
        await page.wait_for_timeout(6000)  # intro cinematic (orbit 4s + fade)
        await page.screenshot(path='/workspace/shots/cinematic.png')
        # avanzar diálogo varias veces
        for i in range(9):
            await page.keyboard.press('Space')
            await page.wait_for_timeout(900)
        await page.screenshot(path='/workspace/shots/dialogue.png')
        for i in range(12):
            await page.keyboard.press('Space')
            await page.wait_for_timeout(700)
        await page.wait_for_timeout(7000)  # tarjeta de capítulo -> play
        await page.screenshot(path='/workspace/shots/play.png')
        # caminar con W
        await page.keyboard.down('KeyW'); await page.wait_for_timeout(1500); await page.keyboard.up('KeyW')
        await page.wait_for_timeout(500)
        await page.screenshot(path='/workspace/shots/walk.png')
        print('ERRORS:', errors[:10] if errors else 'none')
        await browser.close()

asyncio.run(main())
