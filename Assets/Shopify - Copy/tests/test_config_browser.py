from pathlib import Path
from playwright.sync_api import sync_playwright
import re, json
base=Path(__file__).resolve().parents[1]; assets=base/'assets'
results={}
def prepare_html(name):
    html=(base/'tests/fixtures'/f'{name}.html').read_text()
    html=re.sub(r'<script\s+src="[^"]+"\s*>\s*</script>','',html)
    html=re.sub(r'<link[^>]*stylesheet[^>]*>','',html)
    return html

def load(page,name,custom=None):
    errors=[]
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.set_content(prepare_html(name),wait_until='domcontentloaded')
    page.add_style_tag(path=str(assets/f'impress-{name}-configurator.css'))
    page.add_style_tag(path=str(assets/'impress-preview-shared.css'))
    page.add_script_tag(path=str(assets/'impress-editor-core.js'))
    page.add_script_tag(path=str(assets/f'impress-{name}-config.js'))
    if custom: page.add_script_tag(content=custom)
    page.add_script_tag(path=str(assets/f'impress-{name}-editor.js'))
    page.add_script_tag(path=str(assets/f'impress-{name}-configurator.js'))
    page.wait_for_timeout(250)
    return errors

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    # baseline stickers with all four shapes and priced quantities
    page=browser.new_page(viewport={'width':1240,'height':850})
    errors=load(page,'sticker')
    assert not errors, errors
    assert page.locator('[data-impress-shapes] input').count()==4
    assert page.locator('[data-impress-finishes] input').count()==2
    assert page.locator('[data-impress-pieces] option').count()==3
    assert page.locator('[data-impress-variant-id]').input_value()=='110'
    assert page.locator('[data-impress-submit]').is_enabled()
    page.locator('[data-impress-pieces]').select_option('100')
    assert page.locator('[data-impress-variant-id]').input_value()=='111'
    page.locator('[data-impress-art-input]').set_input_files(str(base/'tests/fixtures/transparent-star.png'))
    page.wait_for_timeout(350)
    assert page.locator('[data-ie-scale]').is_enabled()
    page.locator('[data-ie-mode="final"]').click()
    page.wait_for_timeout(100)
    assert page.locator('[data-impress-variant-id]').input_value()=='111'
    results['sticker_original']={'options':4,'variant_for_100':'111','upload_and_final_view':True}
    page.close()

    # restricted catalog: removing Rectangle from config leaves other Shopify variants but hides Rectangle
    page=browser.new_page(viewport={'width':1240,'height':850})
    errors=load(page,'sticker',"""window.ImpressProductConfigs.stickers = {...window.ImpressProductConfigs.stickers,
      shapes:['Contour Cut','Square','Circular'], quantities:[50,100,250,500],
      safeZoneInches:0.09375, editor:{...window.ImpressProductConfigs.stickers.editor,allowStroke:false,allowBackgroundRemoval:false}
    };""")
    assert not errors, errors
    vals=page.locator('[data-impress-shapes] input').evaluate_all('(els)=>els.map(e=>e.value)')
    assert vals==['Contour Cut','Square','Circular'], vals
    assert page.locator('[data-impress-submit]').is_enabled()
    assert page.locator('[data-impress-pieces] option').evaluate_all('(els)=>els.map(e=>e.value)')==['50','100','250']
    assert '0.09375' in page.locator('[data-ie-safe-note]').inner_text()
    assert page.locator('[data-ie-stroke]').is_disabled()
    assert page.locator('[data-ie-remove-bg]').is_disabled()
    assert page.locator('[data-impress-variant-id]').input_value()=='110'
    results['sticker_config']={'shapes':vals,'extra_unpriced_quantity_hidden':True,'safe_in':0.09375,'disabled_tools':True}
    page.close()

    # No matching priced variants: fail closed, but config choices remain selectable for preview
    page=browser.new_page(viewport={'width':1240,'height':850})
    errors=load(page,'sticker',"""window.ImpressProductConfigs.stickers = {...window.ImpressProductConfigs.stickers,
      shapes:['Square'], sizesByShape:{Square:['9 x 9 in']}, quantities:[500]};""")
    assert not errors, errors
    assert page.locator('[data-impress-shapes] input').count()==1
    assert page.locator('[data-impress-sizes] option').first.text_content()=='9 x 9 in'
    assert page.locator('[data-impress-submit]').is_disabled()
    assert page.locator('[data-impress-variant-id]').input_value()==''
    results['sticker_unpriced']={'mode':page.locator('[data-impress-sticker]').get_attribute('data-impress-mode'),'checkout_blocked':True}
    page.close()

    # banner: restrict mounts/sizes; editable grommet measurements; quantities
    page=browser.new_page(viewport={'width':1240,'height':850})
    errors=load(page,'banner',"""window.ImpressProductConfigs.banners = {...window.ImpressProductConfigs.banners,
      mounts:['Argollas'], sizes:['2 x 4 ft','4 x 8 ft'],quantity:{min:1,max:12,step:2},
      grommets:{diameterInches:0.375,cornerCenterInches:0.5,maxSpacingInches:18},
      editor:{allowScaling:false,allowRotation:true}
    };""")
    assert not errors, errors
    assert page.locator('[data-ib-mounts] input').count()==1
    assert page.locator('[data-ib-sizes] option').all_text_contents()==['2 x 4 ft','4 x 8 ft']
    assert page.locator('[data-ib-submit]').is_enabled()
    assert page.locator('[data-ib-quantity]').get_attribute('max')=='12'
    assert page.locator('[data-ib-quantity]').get_attribute('step')=='2'
    assert '0.375' in page.locator('[data-ib-mount-summary]').inner_text()
    assert page.locator('[data-ib-scale]').is_disabled()
    page.locator('[data-ib-sizes]').select_option('4 x 8 ft')
    assert page.locator('[data-ib-variant-id]').input_value()=='1002'
    results['banner_config']={'mounts':1,'sizes':2,'max_qty':12,'grommet_diameter':0.375,'selected_variant':'1002'}
    page.close()

    # baseline banner file editor still works
    page=browser.new_page(viewport={'width':1240,'height':850})
    errors=load(page,'banner')
    assert not errors, errors
    page.locator('[data-ib-art-input]').set_input_files(str(base/'tests/fixtures/banner-art.png'))
    page.wait_for_timeout(350)
    assert page.locator('[data-ib-rotate]').is_enabled()
    page.locator('[data-ib-mode="final"]').click()
    assert page.locator('[data-ib-submit]').is_enabled()
    results['banner_original']={'upload_and_final_view':True,'variant':page.locator('[data-ib-variant-id]').input_value()}
    page.close()
    browser.close()

(base/'tests'/'config-test-results.json').write_text(json.dumps(results,indent=2))
print(json.dumps(results,indent=2))
print('PASS: config browser tests')
