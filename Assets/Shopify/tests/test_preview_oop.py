from pathlib import Path
from playwright.sync_api import sync_playwright
import re,json
base=Path(__file__).resolve().parents[1]
assets=base/'assets'
fixtures={
 'sticker': base/'tests/fixtures/sticker.html',
 'banner': base/'tests/fixtures/banner.html'
}
results={}
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox','--disable-dev-shm-usage'])
    for name in ['sticker','banner']:
        page=browser.new_page(viewport={'width':1240,'height':900}, device_scale_factor=1)
        errors=[]
        page.on('pageerror', lambda error, sink=errors: sink.append(str(error)))
        html=fixtures[name].read_text()
        html=re.sub(r'<script\s+src="[^"]+"\s*>\s*</script>','',html)
        html=re.sub(r'<link[^>]*stylesheet[^>]*>','',html)
        page.set_content(html,wait_until='domcontentloaded')
        page.add_style_tag(path=str(assets/f'impress-{name}-configurator.css'))
        page.add_style_tag(path=str(assets/'impress-preview-shared.css'))
        page.add_script_tag(path=str(assets/'impress-editor-core.js'))
        page.add_script_tag(path=str(assets/f'impress-{name}-editor.js') if name=='banner' else str(assets/'impress-sticker-editor.js'))
        page.add_script_tag(path=str(assets/f'impress-{name}-configurator.js') if name=='banner' else str(assets/'impress-sticker-configurator.js'))
        page.wait_for_timeout(250)
        prefix='ie' if name=='sticker' else 'ib'
        canvas=f'[data-{prefix}-canvas]'
        bg=page.evaluate('''selector=>{const c=document.querySelector(selector), r=c.getBoundingClientRect();let p=c.getContext('2d').getImageData(10,10,1,1).data;return {pixel:[...p],width:r.width,height:r.height};}''',canvas)
        # image upload through the native file input
        file_path=base/'tests/fixtures/transparent-star.png' if name=='sticker' else base/'tests/fixtures/banner-art.png'
        file_selector='[data-impress-art-input]' if name=='sticker' else '[data-ib-art-input]'
        page.locator(file_selector).set_input_files(str(file_path))
        page.wait_for_timeout(450)
        canvas_after=page.evaluate('''selector=>{let c=document.querySelector(selector);return [...c.getContext('2d').getImageData(Math.floor(c.width/2),Math.floor(c.height/2),1,1).data]}''',canvas)
        scale=f'[data-{prefix}-scale]'
        page.locator(scale).evaluate('(el)=>{el.value="143";el.dispatchEvent(new Event("input",{bubbles:true}));el.dispatchEvent(new Event("change",{bubbles:true}));}')
        rotate=f'[data-{prefix}-rotate]'
        page.locator(rotate).evaluate('(el)=>{el.value="22";el.dispatchEvent(new Event("input",{bubbles:true}));el.dispatchEvent(new Event("change",{bubbles:true}));}')
        page.locator(f'[data-{prefix}-mode="final"]').click()
        page.wait_for_timeout(140)
        layer=f'[data-{prefix}-final-layer]'
        transform_before=page.locator(layer).evaluate('(el)=>el.style.transform')
        stage=page.locator(f'[data-{prefix}-stage]')
        r=stage.bounding_box()
        page.mouse.move(r['x']+r['width']*.77, r['y']+r['height']*.29)
        page.wait_for_timeout(90)
        transform_after=page.locator(layer).evaluate('(el)=>el.style.transform')
        page.screenshot(path=str(base/'tests'/f'{name}-oop.png'))
        results[name]={'background':bg,'center_after_upload':canvas_after,'tilt_before':transform_before,'tilt_after':transform_after,'errors':errors,
                        'shape_or_mount_options':page.locator('[data-impress-shapes] input').count() if name=='sticker' else page.locator('[data-ib-mounts] input').count()}
        print(name, results[name])
        assert not errors,f'{name} JavaScript errors: {errors}'
        assert bg['pixel'][3]==255, f'{name} background missing'
        assert transform_after != transform_before, f'{name} tilt did not respond'
        assert results[name]['shape_or_mount_options'] in (2,4), f'{name} product options missing'
        page.close()
    assert results['sticker']['background']['pixel'][:3]==results['banner']['background']['pixel'][:3], 'preview background did not unify'
    browser.close()
(base/'tests'/'test-results.json').write_text(json.dumps(results,indent=2))
print('BROWSER SMOKE TESTS PASSED')
