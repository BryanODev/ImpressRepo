/* IMPRESS FLYERS — margin presets only; Shopify variants define all sellable sizes, sides and quantities. */
window.ImpressProductConfigs=window.ImpressProductConfigs||{};
window.ImpressProductConfigs.flyers=Object.freeze({
  title:'Flyers',
  sizes:[
    {label:'8.5 x 11 in',width:8.5,height:11,margins:{left:0.1,right:0.1,top:0.1,bottom:0.1}},
    {label:'5.5 x 8.5 in',width:5.5,height:8.5,margins:{left:0.25,right:0.25,top:0.1,bottom:0.1}},
    {label:'4.25 x 5.5 in',variantLabels:['4.25 x 5.5 in','5.5 x 4.25 in'],width:4.25,height:5.5,margins:{left:0.25,right:0.25,top:0.25,bottom:0.25}}
  ],
  orientation:{enabled:true,options:['Vertical','Horizontal'],default:'Vertical'},
  cutGuideDefaultOn:true,safeGuideDefaultOn:true,
  editor:{allowScaling:true,allowRotation:true},
  maxArtworkMB:20
});
