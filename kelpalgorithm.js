var alos = ee.Image("JAXA/ALOS/AW3D30/V2_2");
var srtm = ee.Image("USGS/SRTMGL1_003");
//Kelp Index, app for researchers (Google Earth Engine code)
//Mora-Soto, A., Palacios, M., Macaya, E., Gomez, I., Huovinen, P., Perez-Matus, A., Young, M., Golding, N., Toro, M., Yaqub, M., Macias-Fauria, M. (n.d.,) A high-resolution global map of giant kelp forests and intertidal green algae with Sentinel-2 images.

// 1st step: Define geometry (line 129)


///////////////////////////////////////////////////////////////////////////////////////
///-----------------------------------------------------------------------------------

///////Lines 9-830
///////Cloud-free algorithm 
//Source: SIMONETTI, Dario, et al. First results from the phenology-based synthesis classifier using Landsat 8 imagery. IEEE Geoscience and remote sensing letters, 2015, vol. 12, no 7, p. 1496-1500.
// --------------------------------------------------------------------------------------------------------
//  ----------  Date OPTIONS 
// -------------------------------------

 
var start_date='2015-06-23';   // to be defined 
var end_date='2019-06-23';   // to be defined
//var countries = ee.FeatureCollection('ft:1tdSwUL7MVpOauSgRzqVTOwdfy17KDbw-1d9omPw');deprecated

//Map.addLayer(countries,{},'All countries',0);
// --------------------------------------------------------- -----------------------------------------------
//  ----------  Country OPTIONS 
// -------------------------------------
var buffer = 30000;
var max_cloud_percent=30;    // remove cloudy images but i would suggest using any acquisition
// --------------------------------------------------------------------------------------------------------
//  ----------  Classify a box of DELTAxy OPTIONS 
// -------------------------------------
var use_centerpoint=0;        // set to 1 to classify a box of DELTAxy; Location= Map.getCenter() 
Map.setCenter(69.3608, -49.2906) // Validation sites --> change or comment to use a dynamic map center. Custom coords: Kerguelen Is.  
var DELTAx=1;               // Long size   
var DELTAy=1;               // Lat  size 
// --------------------------------------------------------------------------------------------------------
//  ----------  EXPORT OPTIONS 
// --------------------------------------------------------------------------------------------------------
var Google_drive_root_folder= 'GEE_classification';
var export_map=0;    // Export PBS classification to your GDrive
var export_tiles=1;  // Export PBS classification in pieces if too big 2 = 4 tiles; 3 = 9 tiles 

// --------------------------------------------------------------------------------------------------------
// ----------- EXTRA SETTING 
// --------------------------------------------------------------------------------------------------------

var debug_mode = 0;  // add all layers to the OUT PBS classification to better understand class proportions --> Pixels info console
var EVG_domain = 0;   // set to 1 if on tropics / dense evergreen -> recodes brigt forest to dark (haze contamination) 

var clouds_morpho_filter = 0;  // enable cloud / shadow buffering     --- too be better implemented, time consuming 
var clouds_filter_size = 500;  // add buffer in meters  aroud clouds  --- too be better implemented
var shadow_filter_size = 500;  // add buffer in meters aroud shadows  --- too be better implemented
function rgb(r,g,b){
          var bin = r << 16 | g << 8 | b;
          return (function(h){
          return new Array(7-h.length).join("0")+h
          })(bin.toString(16).toUpperCase())
}



var mypalette=[
      rgb(20,20,20),    //0  no data 
      rgb(255,255,255), //1  Clouds
      rgb(175,238,238), //2  Temporary snow
      rgb(0,255,255),   //3  Snow
        rgb(0,0,205),   //4   WATER  used in single date -----
        rgb(0,0,205),   //5   WATER  used in single date -----
      rgb(200,190,220), //6  Water + DRY 
      rgb(100,149,237) ,//7  Water -----
      rgb(0,0,205),     //8  Water
      rgb(150,250,200), //9  WATER+FOREST -----
      rgb(10,108,0) ,   //10  EVG DENSE -----
      rgb(0,128,0) ,    //11  EVG DENSE -----
      rgb(34,139,34) ,  //12  EVG DENSE -----
      rgb(50,205,50),   //13  EVG DENSE/SHRUB -----
      rgb(190,255,90) , //14  EVG GRASS -----
      rgb(30,250,30),   //15  EVG OPEN
      rgb(120,160,50)  ,//16  EVG SHRUB -----
       'FF0000',        //17  EMPTY -----
       'FF0000',        //18  EMPTY -----
        'FF0000',       //19  EMPTY -----
      rgb(160,225,150), //20  DEC Close Humid -----
      rgb(210,250,180) ,//21  DEC Open Humid -----
      rgb(215,238,158), //22  EMPTY -----
        'FF0000',       //23  EMPTY -----
        'FF0000',       //24  EMPTY -----
      rgb(128,118,26) ,  //25  DEC Close dry -----rgb(128,118,26)
      rgb(140,150,30) , //26  DEC Open dry -----rgb(140,150,30)
      rgb(153,193,193), //27  IRRIG AGRI -----
      rgb(216,238,160) ,//28  DEC SHRUB dense humid
      rgb(237,255,193) ,//29  DEC SHRUB  -----
      rgb(240,250,220), //30  DEC SHRUB sparse
      rgb(227,225,170) ,//31  GRASS + bush -----
      rgb(212,189,184), //32  GRASS -----
      rgb(255,255,0),   //33  EMPTY -----
      rgb(255,225,255), //34  SOIL+GRASS -----
      rgb(140,5,198),   //35  SOIL -----
      rgb(158,132,123), //36  DARK SOIL -----
        'FF0000', //37  EMPTY -----
        'FF0000', //38  EMPTY -----
        'FF0000', //39  EMPTY -----
      rgb(40,70,20),    //40  Shawodw on vegetation
      rgb(145,0,10),    //41  Dark soil 
      rgb(100,100,100), //42  Shawodw mainly on soil 
       '8B4513' //43  test soil -----
  ];

                 
var CLASSvis = {
  'bands':'Class',
  min: 0,
  max: 43,
  palette: mypalette
};


// --------------------------------------------------------------------------------------------------------

         print("Running classification");
            //--------------------------------------------------------------------------------------
         
          if (use_centerpoint === 0){
              //////////////////////////////////////////////////////////////
              //1st step select country
              //////////////////////////////////////////////////////////////
              //var country = countries.filter(ee.Filter.inList('Country', countrynames));
              var AOI = geometry; //geometry 
          }    
          
          
          else {
              var CX=Map.getCenter().coordinates().getInfo()[0];  
              var CY=Map.getCenter().coordinates().getInfo()[1];   
              var countrynamesExport="MyMap";
              var countryname="MyMap";
             var AOI =ee.Geometry.Polygon([[
                [CX-DELTAx, CY-DELTAy],[CX+DELTAx,CY-DELTAy],[CX+DELTAx,CY+DELTAy],[CX-DELTAx, CY+DELTAy],[CX-DELTAx, CY-DELTAy] 
                ]]);
          }
          
          Map.addLayer(AOI,{},'AOI',1); 

    
          var collectionS2 = ee.ImageCollection('COPERNICUS/S2').filterDate(start_date,end_date)  //
                         .filterMetadata('CLOUDY_PIXEL_PERCENTAGE',"less_than",max_cloud_percent)
                         .filterBounds(AOI)
                         //.filterMetadata('system:asset_size', 'greater_than', 900000000)
                         .map(function(image){return PINO1(image.clip(AOI),['B2','B3','B4','B8','B11','B12','QA60','B1','B9'])})
                         .median();   
          
          
          // Sentinel 2 using the ESA CLoud Mask
          // cloudMask
          function cloudMask(im) {
            // Opaque and cirrus cloud masks cause bits 10 and 11 in QA60 to be set,
            // so values less than 1024 are cloud-free
            var mask = ee.Image(0).where(im.select('QA60').gte(1024), 1).not();
            return im.updateMask(mask);
          }
          // cloudMask
          // Collection of S2 (Cloud Free)
          var medianS22015 = ee.ImageCollection('COPERNICUS/S2')
                      .filterDate(start_date,end_date)
                      .filterBounds(AOI)
                      .map(cloudMask)
                      .median()
                      .clip(AOI);
          
          
    //      Map.addLayer(medianS22015, {bands:['B11','B8','B4'], min:0, max:3000}, 'S2 composite ESA',0);
    //      Map.addLayer(collectionS2, {bands:['B11','B8','B4'], min:0, max:3000}, 'S2 composite ONLY JRC median',0);
           
          
          var collectionS2_mod = ee.ImageCollection.fromImages([collectionS2,medianS22015,medianS22015.unmask().multiply(0).add(65000).clip(AOI)]).min();
          // var classification = PINO2(collectionS2_mod, ['B2','B3','B4','B8','B11','B12','QA60','B1','B9']);
          // Map.addLayer(classification,CLASSvis,'S2 composite JRC + ESA Class',1);
          
        //  collectionS2_mod = collectionS2_mod.multiply(0.051).byte();
    //      Map.addLayer(collectionS2_mod, {bands:['B11','B8','B4'], min:0, max:255}, 'S2 composite JRC + ESA',0);
          
var compositeJRC = collectionS2.divide(10000)
var collectionS2_mod10000 = collectionS2_mod.divide(10000)
// Map.addLayer(compositeJRC, {bands:['B11','B8','B4'], min:0, max:0.5}, 'S2 composite jrc',1);
 Map.addLayer(collectionS2_mod10000, {bands:['B11','B8','B4'], min:0, max:0.5}, 'collectionS2_mod10000',1);
          

         
          //############################################################
          //###############  Export CLASSIF  ###########################
          //############################################################
         
         
          
          // Export.image.toDrive(
          //           {'image':classification,    
          //           'description': countrynamesExport+'_class',
          //           'folder': Google_drive_root_folder, 
          //           'region':JSON.stringify(AOI.geometry().bounds().coordinates().getInfo()),
          //           'scale':10, //10
          //           'skipEmptyTiles':true,
          //           'maxPixels': 1e13
          //           }); 
          //############################################################
          //###############  Export loop  ##############################
          //#############################################################
          
          if (export_map == 1){
                if (use_centerpoint === 1){
                  var cc = AOI.bounds().coordinates().getInfo();
                } else {
                  var cc = AOI.geometry().bounds().coordinates().getInfo();
                }
                

                      //.divide(5000).multiply(255).byte(), 
                      Export.image.toDrive(
                          {'image':collectionS2_mod.select('B2','B3','B4','B5','B6','B7','B8','B8A','B9','B10','B11','B12'),    //'B2','B3','B4',
                          'description': countrynamesExport+'_1184',
                           'folder': Google_drive_root_folder, 
                           'region':AOI,
                           'scale':10, //10
                           'skipEmptyTiles':true,
                           'maxPixels': 1e13
                          }); 

       
          } // and IF export 
          
          
          




                 

//-------------------------------------------------------------------------------------------------------------------------------
//  ----------     MY Single Date Classification ONLY MAIN CLASSED + WATER        -----------------------------------------------
//-------------------------------------------------------------------------------------------------------------------------------

// INPUT 1: image to be classified 
// INPUT 2: bands conbination (B,G,R,NIR,SWIR1,SWIR2) -> Landsat TM = (1,2,3,4,5,7)
// OUT :  classified input(same number of layers); Class code is not the same as the PBS  
function PINO1(image,BANDS){
    
  var BLU=image.select(BANDS[0]).divide(10000);
    var GREEN=image.select(BANDS[1]).divide(10000);
    var RED=image.select(BANDS[2]).divide(10000);
    var NIR=image.select(BANDS[3]).divide(10000);
    var SWIR1=image.select(BANDS[4]).divide(10000);
    var SWIR2=image.select(BANDS[5]).divide(10000);

    var ESA_filter = image.select(BANDS[6])
    var B1 = image.select(BANDS[7]).divide(10000);
    var B9 = image.select(BANDS[8]).divide(10000);
    
    
    var OUT=ee.Image(0);
    
    var th_NDVI_MAX_WATER=0;
    var th_NDVI_SATURATION=0.0037;
    var th_NDVI_MIN_CLOUD_BARE=0.35;
    var th_NDVI_MIN_VEGE=0.45;
    
    var th_SHALLOW_WATER=-0.1;
    var th_RANGELAND=0.49;
    var th_GRASS=0.53;
    var th_SHRUB=0.63;
    var th_TREES=0.78 ;
    //var th_TREES=0.85 ;
    
   
     
    var min123=BLU.min(GREEN).min(RED);
     
    var min1234=min123.min(NIR);
    var min12345=min1234.min(SWIR1);
    var min123457=min12345.min(SWIR2);
    
    var min234=GREEN.min(RED).min(NIR);
    
    var max234=GREEN.max(RED).max(NIR);
    var max1234=max234.max(BLU);
    
    var max57=SWIR1.max(SWIR2);
    var max457=max57.max(NIR);
    
    var max123457= max1234.max(max57);
    
    
    var BLUgtGREEN  = BLU.gt(GREEN);
    var BLUgteGREEN = BLU.gte(GREEN);
    var BLUlteNIR   = BLU.lte(NIR);
    
    var GREENgtRED  = GREEN.gt(RED);
    var GREENlteRED = GREEN.lte(RED);
    var GREENgteRED = GREEN.gte(RED);
    var REDlteNIR= RED.lte(NIR);
    
    var REDsubtractGREEN = (RED.subtract(GREEN)).abs();
    var BLUsubtractNIR   = BLU.subtract(NIR)
    
    var BLUgtGREENgtRED=BLUgtGREEN.and(GREENgtRED)
    
    var growing14=(BLU.lte(GREEN)).and(GREENlteRED).and(REDlteNIR);
    var growing15=growing14.and(NIR.lte(SWIR1));
    
    var decreasing2345=(GREENgteRED).and(RED.gte(NIR)).and(NIR.gte(SWIR2));   // DS
    
    
    var SATURATION=(max234.subtract(min234)).divide(max234);
//0.15092b+0.19733g+0.32794r+0.34068n−0.711211s1−0.457212s2
    // var WETNESS= image.expression('byte(b("'+BANDS[0]+'")*255)*0.2626 + byte(b("'+BANDS[1]+'")*255)*0.21 + byte(b("'+BANDS[2]+'")*255)*0.0926 + byte(b("'+BANDS[3]+'")*255)*0.0656 - byte(b("'+BANDS[4]+'")*255)*0.7629 - byte(b("'+BANDS[5]+'")*255)*0.5388');
    
    //var WETNESS= (BLU.multiply(0.2626*255)).add(GREEN.multiply(0.21*255)).add(RED.multiply(0.0926*255)).add(NIR.multiply(0.056*255)).subtract(SWIR1.multiply(0.7629*255)).subtract(SWIR2.multiply(0.5388*255))
    var WETNESS= (BLU.multiply(0.15092)).add(GREEN.multiply(0.19733)).add(RED.multiply(0.32794)).add(NIR.multiply(0.34068)).subtract(SWIR1.multiply(0.711211)).subtract(SWIR2.multiply(0.457212))
    
    var NDVI=(NIR.subtract(RED)).divide(NIR.add(RED));
    var NDSI=(GREEN.subtract(SWIR1)).divide(GREEN.add(SWIR1));
    
    var BRIGTSOIL=((BLU.lt(0.27)).and(growing15)).or((BLU.lt(0.27)).and(growing14).and(  ((NIR.subtract(SWIR1)).gt(0.038)))); 
    
    
    var WATER_NOT_SHADOW = GREEN.gte((BLU.add(RED)).divide(2.0).multiply(0.95)).and(NIR.lte((RED.add(SWIR1)).divide(2.0).multiply(1.10))).and(SWIR1.lt(0.7));
    var WATERSHAPE= ((BLU.subtract(GREEN)).gt(-0.2)).and(decreasing2345).and(WETNESS.gt(0)); //add other cond
    var OTHERWATERSHAPE= (BLUgteGREEN).and(GREENgteRED).and(NIR.gte(RED)).and(SWIR1.lt(NIR)).and(SWIR2.lte(SWIR1)).and(NIR.lt((RED).multiply(1.3)).and(NIR.lt(0.12)).and(SWIR1.lt(RED)).and(NIR.lte(GREEN)).and(NIR.gt(0.039)).and(WETNESS.gt(0))  ); //add other cond  07/10 (add replaced with and  :) and(NIR.lte(GREEN))
    
    
    
    var SNOWSHAPE=((min1234.gt(0.30)).and(NDSI.gt(0.65))).or(WETNESS.gt(1).and(WATERSHAPE.eq(0)));
    
    var CLOUDSHAPE = ((SNOWSHAPE.eq(0)).and(BRIGTSOIL.eq(0))).and(
                  ((max123457.gt(0.3)).and(min1234.gt(0.17))).or(
                    
                    ((min123.gt(0.17)).and((SWIR1).gt(min123))).and(
                          ((SATURATION.gte(0.2)).and(SATURATION.lte(0.4)).and(max234.gte(0.35)) ).or ((NDSI.lt(0.65)).and(max1234.gt(0.30)).and( (NIR.divide(RED)).gte(1.3) ).and((NIR.divide(GREEN)).gte(1.3)).and( (NIR.divide(SWIR1)).gte(0.95)  )) 
                                                                   )
                                                                   
                                                                  ) 
                                                              ) 
    
    min123=0
    
    BRIGTSOIL=0
    SATURATION=0
    //decreasing2345=0
    // main groups based on ndvi
    var ndvi_1 = NDVI.lte(th_NDVI_MAX_WATER);
    var ndvi_2 = NDVI.lt(th_NDVI_MIN_VEGE).and(ndvi_1.eq(0));
    var ndvi_3 = NDVI.gte(th_NDVI_MIN_VEGE);
    
    
    //-------------------------------------------------------------------------------------------------------------
		//----------------------  SECTION 1 : WATER  ---------------------------------------------------------
		//-------------------------------------------------------------------------------------------------------------
    
    OUT=(ndvi_1.and(SNOWSHAPE)).multiply(3);
    OUT=OUT.where( OUT.eq(0).and(ndvi_1).and(
                    (WATERSHAPE.and(BLU.gt(0.078)).and(GREEN.gt(0.04)).and(GREEN.lte(0.15)).and(max57.lt(0.1)))//.or(
                    //(RED.gte(max457)).and(RED.lte(0.19)).and(RED.gt(0.04)).and(BLU.gt(0.078)).and(max57.lt(0.1))) )
                    )//.and(BLU.subtract(GREEN).lte(0.02))
                    .and(SWIR1.lt(0.05))
                    .and(BLU.lt(0.118))
                    ,8);
    
    
    OUT=OUT.where( ndvi_1.and(OUT.eq(0)).and(BLU.gt(0.94)).and(GREEN.gt(0.94)).and(RED.gt(0.94)).and(NIR.gt(0.94)) ,1);  // TEST CLOUDS L8
    OUT=OUT.where( ndvi_1.and(OUT.eq(0)).and(min123457.gt(0.18)).and(max1234.gt(SWIR2)),1); 
    OUT=OUT.where(( (ndvi_1).and(OUT.eq(0)).and(
                      CLOUDSHAPE.or(
                      (BLUgtGREENgtRED.and(NIR.gt(0.254)).and( BLU.gt(0.165)).and(NDVI.lt(0.40))).or(
                      (BLUgtGREEN.and(BLU.gt(0.27)).and(GREEN.gt(0.21)).and( REDsubtractGREEN.lte(0.1)).and(NIR.gt(0.35)))).or(
                      (BLU.gt(0.94)).and(GREEN.gt(0.94)).and(RED.gt(0.94)).and(NIR.gt(0.94))))
                      
                      )),1);


    //-------------------------------------------------------------------------------------------------------------
		//---------------------  SECTION 2 : CLOUDS or SOIL  ---------------------------------------------------------
		//------------------------------------------------------------------------------------------------------------
    
     OUT=OUT.where(( (ndvi_2).and(SNOWSHAPE)),3);
    
     OUT=OUT.where(( (ndvi_2).and(OTHERWATERSHAPE).and(BLU.gt(0.078)).and(max57.lt(0.058))),8 );
    
     OUT=OUT.where(( (ndvi_2).and(
                      CLOUDSHAPE.or(
                      (BLUgtGREENgtRED.and(NIR.gt(0.254)).and( BLU.gt(0.165)).and(NDVI.lt(0.40))).or(
                      (BLUgtGREEN.and(BLU.gt(0.27)).and(GREEN.gt(0.21)).and( REDsubtractGREEN.lte(0.1)).and(NIR.gt(0.35)))).or(
                      (BLU.gt(0.94)).and(GREEN.gt(0.94)).and(RED.gt(0.94)).and(NIR.gt(0.94))))
                      
                      )),1);

    
    
    //OUT=OUT.where(OUT.neq(3).and(QA.gte(1024)),1);
    
     // ESA FILTER
    //OUT=OUT.where( ESA_filter.gte(1024), 1);

    //OUT=OUT.where( B1.gte(0.1550).and(BLU.gte(0.2)).and(B9.gt(0.09)), 1);


    return image.mask(OUT.neq(1))
   
}   // SINGLE DATE CLASSIFICATION

function PINO1_old(image,BANDS){
    
    var th_NDVI_MAX_WATER=0;
    var BLU=image.select(BANDS[0]).divide(10000);
    var GREEN=image.select(BANDS[1]).divide(10000);
    var RED=image.select(BANDS[2]).divide(10000);
    var NIR=image.select(BANDS[3]).divide(10000);
    var SWIR1=image.select(BANDS[4]).divide(10000);
    var SWIR2=image.select(BANDS[5]).divide(10000);
    
    var ESA_filter = image.select(BANDS[6])
    var B1 = image.select(BANDS[7]).divide(10000);
    var B9 = image.select(BANDS[8]).divide(10000);

    var OUT=ee.Image(0);
    var OUT2=ee.Image(0);
    var OUT3=ee.Image(0);
    
    var th_NDVI_SATURATION=0.0037;
    var th_NDVI_MIN_CLOUD_BARE=0.35;
    var th_NDVI_MIN_VEGE=0.45;
    
    var th_SHALLOW_WATER=-0.1;
    var th_RANGELAND=0.50;
    var th_GRASS=0.55;
    var th_SHRUB=0.65;
    var th_TREES=0.78 ;
    //var th_TREES=0.85 ;
    
   
     
    var min123=BLU.min(GREEN).min(RED);
     
    var min1234=min123.min(NIR);
    var min234=GREEN.min(RED).min(NIR);
    
    var max234=GREEN.max(RED).max(NIR);
    var max1234=max234.max(BLU);
    
    var max57=SWIR1.max(SWIR2);
    var max457=max57.max(NIR);
    
    var max123457= max1234.max(max57);
    
    
    var BLUgtGREEN  = BLU.gt(GREEN);
    var BLUgteGREEN = BLU.gte(GREEN);
    var BLUlteNIR   = BLU.lte(NIR);
    
    var GREENgtRED  = GREEN.gt(RED);
    var GREENlteRED = GREEN.lte(RED);
    var GREENgteRED = GREEN.gte(RED);
    var REDlteNIR= RED.lte(NIR);
    
    var REDsubtractGREEN = (RED.subtract(GREEN)).abs();
    var BLUsubtractNIR   = BLU.subtract(NIR)
    
    var BLUgtGREENgtRED=BLUgtGREEN.and(GREENgtRED)
    
    var growing14=(BLU.lte(GREEN)).and(GREENlteRED).and(REDlteNIR);
    var growing15=growing14.and(NIR.lte(SWIR1));
    
    var decreasing2345=(GREENgteRED).and(RED.gte(NIR)).and(NIR.gte(SWIR1));
    
    
    var SATURATION=(max234.subtract(min234)).divide(max234);

    //var WETNESS=BLU.multiply(-1);// image.expression('byte(b("'+BANDS[0]+'")*255)*0.2626 + byte(b("'+BANDS[1]+'")*255)*0.21 + byte(b("'+BANDS[2]+'")*255)*0.0926 + byte(b("'+BANDS[3]+'")*255)*0.0656 - byte(b("'+BANDS[4]+'")*255)*0.7629 - byte(b("'+BANDS[5]+'")*255)*0.5388');
    
    var NDVI=(NIR.subtract(RED)).divide(NIR.add(RED));
    var NDSI=(BLU.subtract(SWIR1)).divide(GREEN.add(SWIR1));
    
    var BRIGTSOIL=((BLU.lt(0.27)).and(growing15)).or((BLU.lt(0.27)).and(growing14).and(  ((NIR.subtract(SWIR1)).gt(0.038)))); 
    
    //var WATERSHAPE= ((BLU.subtract(GREEN)).gt(-0.2)).and(decreasing2345); //add other cond
    //var OTHERWATERSHAPE= (BLUgteGREEN).and(GREENgteRED).and(NIR.gte(RED)).and(SWIR1.lt(NIR)).and(SWIR2.lte(SWIR1)).and(NIR.lt((RED).multiply(1.3)).and(NIR.lt(0.12)).and(SWIR1.lt(RED)).and(NIR.lte(GREEN)).and(NIR.gt(0.039))  ); //add other cond  07/10 (add replaced with and  :) and(NIR.lte(GREEN))
    
    var SNOWSHAPE=(min1234.gt(0.30)).and(NDSI.gt(0.65));
    
    var CLOUDSHAPE = ((SNOWSHAPE.eq(0)).and(BRIGTSOIL.eq(0))).and(      //
                  ((max123457.gt(0.47)).and(min1234.gt(0.37))).or(
                    
                    ((min123.gt(0.17)).and((SWIR1).gt(min123))).and(
                          ((SATURATION.gte(0.2)).and(SATURATION.lte(0.4)).and(max234.gte(0.35)) ).or ((NDSI.lt(0.65)).and(max1234.gt(0.30)).and( (NIR.divide(RED)).gte(1.3) ).and((NIR.divide(GREEN)).gte(1.3)).and( (NIR.divide(SWIR1)).gte(0.95)  )) 
                                                                   )
                                                                   
                                                                  ) 
                                                              ) 
    
    min123=0
    
    BRIGTSOIL=0
    SATURATION=0
    decreasing2345=0
    // main groups based on ndvi
    var ndvi_1 = NDVI.lte(th_NDVI_MAX_WATER);
    var ndvi_2 = NDVI.lt(th_NDVI_MIN_VEGE).and(ndvi_1.eq(0));
    //var ndvi_3 = NDVI.gte(th_NDVI_MIN_VEGE);
    
    
    //-------------------------------------------------------------------------------------------------------------
		//----------------------  SECTION 1 : WATER  ---------------------------------------------------------
		//-------------------------------------------------------------------------------------------------------------
    
    OUT=(ndvi_1.and(SNOWSHAPE)).multiply(3);
    // OUT=OUT.where( (ndvi_1).and(
    //                 (WATERSHAPE.and(BLU.gt(0.078)).and(GREEN.gt(0.04)).and(GREEN.lte(0.12)).and(max57.lt(0.04))).or(
    //                 (RED.gte(max457)).and(RED.lte(0.19)).and(RED.gt(0.04)).and(BLU.gt(0.078)).and(max57.lt(0.04))) ),8);
    
    
    OUT=OUT.where(( (ndvi_1).and(BLU.gt(0.94)).and(GREEN.gt(0.94)).and(RED.gt(0.94)).and(NIR.gt(0.94)) ),1);  // TEST CLOUDS L8
                   
		//OUT=OUT.where(( (OUT.eq(0)).and(ndvi_1)),8);
    
    
    //-------------------------------------------------------------------------------------------------------------
		//---------------------  SECTION 2 : CLOUDS or SOIL  ---------------------------------------------------------
		//------------------------------------------------------------------------------------------------------------
    
     //OUT=OUT.where(( (ndvi_2).and(SNOWSHAPE)),3);
    
     //OUT=OUT.where(( (ndvi_2).and(OTHERWATERSHAPE).and(BLU.gt(0.078)).and(max57.lt(0.058))),8 );
    
     OUT=OUT.where(( (ndvi_2).and(
                      CLOUDSHAPE.or(
                      (BLUgtGREENgtRED.and(NIR.gt(0.254)).and( BLU.gt(0.165)).and(NDVI.lt(0.40))).or(
                      (BLUgtGREEN.and(BLU.gt(0.27)).and(GREEN.gt(0.21)).and( REDsubtractGREEN.lte(0.1)).and(NIR.gt(0.35)))).or(
                      (BLU.gt(0.94)).and(GREEN.gt(0.94)).and(RED.gt(0.94)).and(NIR.gt(0.94))))
                      
                      )),1);

    CLOUDSHAPE=0
 
    //OUT=OUT.where(( (ndvi_2).and(BLU.lt(0.13)).and(BLUgtGREENgtRED).and(RED.lt(0.05)).and( BLUsubtractNIR.lt(-0.04))     ),40);    //similar 2 cl 42 simplify
     
    //OUT=OUT.where(( (OUT.eq(0)).and(ndvi_2).and(WETNESS.gt(5))),8   ); //only at this point to avoid confusion with shadows
    //WETNESS=0
   
    OUT=OUT.where(( (ndvi_2).and(BLU.lt(0.13)).and(BLUgtGREENgtRED).and(RED.lt(0.05)).and( BLUsubtractNIR.lt(0.04))        ),42   );
    
    // OUT=OUT.where(( (OUT.eq(0)).and(ndvi_2).and(
    //                 ((BLU.lt(0.14)).and(BLU.gt(0.10)).and(BLUgtGREENgtRED).and(RED.lt(0.06)).and(NIR.lt(0.14)).and( ((NIR).subtract(BLU)).lt(0.02))).or(
    //                 ( ((((NIR.subtract(GREEN)).abs().lte(0.01)).add( BLUsubtractNIR.gte(0.01))).gt(0)).and(BLUgtGREENgtRED).and(NIR.gte(0.06)) )).or(
    //                 ( (OUT.eq(0)).and(ndvi_2).and(NDVI.lte(0.09)).and(NIR.lt(0.4)).and(GREENlteRED).and(REDlteNIR)) )
    //               )),41);
  
   // OUT=OUT.where(( (OUT.eq(0)).and(ndvi_2).and(NDVI.lte(0.20)).and(NIR.gt(0.3)).and(growing14)   ),34 );
     
     
    //OUT=OUT.where(( (OUT.eq(0)).and(ndvi_2).and(NDVI.gte(0.35)).and(BLUgteGREEN).and(REDsubtractGREEN.lt(0.04))    ),21 );
     
    //OUT=OUT.where(( (OUT.eq(0)).and(ndvi_2).and(NDVI.gte(0.20)).and( REDsubtractGREEN.lt(0.05))   ),30 );
     
    //OUT=OUT.where(( (OUT.eq(0)).and(ndvi_2)),31);
      
    REDsubtractGREEN=0
    BLUgteGREEN=0
     
    //-------------------------------------------------------------------------------------------------------------
		//----------------------  SECTION 3 : VEGETATION  -------------------------------------------------------------
		//-------------------------------------------------------------------------------------------------------------
    
    // var MyCOND=(ndvi_3).and(NDVI.lt(th_RANGELAND));
    // OUT=OUT.where(( (MyCOND).and(NIR.gte(0.15)) ),21);
    // OUT=OUT.where(( (MyCOND).and(NIR.lt(0.15))  ),40);
    
    // MyCOND=(ndvi_3).and(NDVI.lt(th_GRASS));
    // OUT=OUT.where(( (MyCOND).and(BLUlteNIR).and(NIR.lt(0.15))  ),40);
    // OUT=OUT.where(( (OUT.eq(0)).and(
    //                                 ((MyCOND).and(BLUlteNIR)).or( (NDVI.lt(th_SHRUB) ).and(NIR.gt(0.22)))).and(NDSI.lt(-0.35))  ),16);
  
                                    
    // OUT=OUT.where(( (MyCOND).and(BLU.gt(NIR)) ),40);
    // OUT=OUT.where(( (OUT.eq(0)).and(MyCOND)).and(NDSI.lt(-0.3)),16);                                        
    // OUT=OUT.where( (ndvi_3).and(OUT.eq(0)).and(NDSI.gt(-0.25))  ,10);
    
    // OUT=OUT.where(((OUT.eq(0)).and(ndvi_3).and(NDVI.gt(th_TREES)) ),9);
    
    // OUT=OUT.where(( (OUT.eq(0)).and(NDVI.lt(th_GRASS))),21);
    // OUT=OUT.where(( (OUT.eq(0)).and(NDSI.lt(-0.25))),13);
    // OUT=OUT.where(( (OUT.eq(0))),16);
    
   // function cloudMask(im) {
  //// Opaque and cirrus cloud masks cause bits 10 and 11 in QA60 to be set,
  //// so values less than 1024 are cloud-free
  //var mask = ee.Image(0).where(im.select('QA60').gte(1024), 1).not();
  //return im.updateMask(mask);
//}
    
    
    // ESA FILTER
    OUT=OUT.where( ESA_filter.gte(1024), 1);
    
    // NIR saturation
    //OUT=OUT.where( NIR.gte(0.3), 1);
    
        // NIR saturation
    //OUT=OUT.where( BLU.gte(0.2), 1);
   
   //OUT = OUT.where(BLU.gte(0.1610).and(B1.gte(0.1500)), 1);
   //OUT = OUT.where(B1.gte(0.1550), 1);
   // NIR saturation
    OUT2=OUT2.where( B1.gte(0.1550).and(BLU.gte(0.2)).and(B9.gt(0.09)), 1);
   
   //OUT = OUT.where(BLU.gte(0.1610).and(B1.gte(0.1500)), 1);
   //OUT2 = OUT2.where(B1.gte(0.1550).and(B9.gt(0.09)), 1);
   
    
 // OUT2=OUT2.focal_max(50,'circle','meters',1); 
    
  // OUT = OUT.where(BLU.gte(0.1610).and(B1.gte(0.1500)), 1);
  
  OUT3 = OUT3.where(OUT.eq(1), 1);
 // OUT3=OUT3.focal_max(50,'circle','meters',1);
  
   OUT = OUT.where(OUT2.gte(1), 1);
   OUT = OUT.where(OUT3.gte(1), 1);
   

   
    //return (OUT.select([0],["Class"]).toByte());
    // return (image.updateMask(OUT.lte(3)));
    //return image.and((OUT.select([0],["Class"]).toByte()));
    return image.mask(OUT.neq(1))
   
}   // SINGLE DATE CLASSIFICATION

function PINO2(image,BANDS){
    
    var th_NDVI_MAX_WATER=0;
    var BLU=image.select(BANDS[0]).divide(10000);
    var GREEN=image.select(BANDS[1]).divide(10000);
    var RED=image.select(BANDS[2]).divide(10000);
    var NIR=image.select(BANDS[3]).divide(10000);
    var SWIR1=image.select(BANDS[4]).divide(10000);
    var SWIR2=image.select(BANDS[5]).divide(10000);
             
    var OUT=ee.Image(0);
    
    var th_NDVI_SATURATION=0.0037;
    var th_NDVI_MIN_CLOUD_BARE=0.35;
    var th_NDVI_MIN_VEGE=0.45;
    
    var th_SHALLOW_WATER=-0.1;
    var th_RANGELAND=0.50;
    var th_GRASS=0.55;
    var th_SHRUB=0.65;
    var th_TREES=0.78 ;
    //var th_TREES=0.85 ;
    
   
     
    var min123=BLU.min(GREEN).min(RED);
     
    var min1234=min123.min(NIR);
    var min234=GREEN.min(RED).min(NIR);
    
    var max234=GREEN.max(RED).max(NIR);
    var max1234=max234.max(BLU);
    
    var max57=SWIR1.max(SWIR2);
    var max457=max57.max(NIR);
    
    var max123457= max1234.max(max57);
    
    
    var BLUgtGREEN  = BLU.gt(GREEN);
    var BLUgteGREEN = BLU.gte(GREEN);
    var BLUlteNIR   = BLU.lte(NIR);
    
    var GREENgtRED  = GREEN.gt(RED);
    var GREENlteRED = GREEN.lte(RED);
    var GREENgteRED = GREEN.gte(RED);
    var REDlteNIR= RED.lte(NIR);
    
    var REDsubtractGREEN = (RED.subtract(GREEN)).abs();
    var BLUsubtractNIR   = BLU.subtract(NIR)
    
    var BLUgtGREENgtRED=BLUgtGREEN.and(GREENgtRED)
    
    var growing14=(BLU.lte(GREEN)).and(GREENlteRED).and(REDlteNIR);
    var growing15=growing14.and(NIR.lte(SWIR1));
    
    var decreasing2345=(GREENgteRED).and(RED.gte(NIR)).and(NIR.gte(SWIR1));
    
    
    var SATURATION=(max234.subtract(min234)).divide(max234);

    // var WETNESS= image.expression('byte(b("'+BANDS[0]+'")*255)*0.2626 + byte(b("'+BANDS[1]+'")*255)*0.21 + byte(b("'+BANDS[2]+'")*255)*0.0926 + byte(b("'+BANDS[3]+'")*255)*0.0656 - byte(b("'+BANDS[4]+'")*255)*0.7629 - byte(b("'+BANDS[5]+'")*255)*0.5388');
    var WETNESS= (BLU.multiply(0.2626*255)).add(GREEN.multiply(0.21*255)).add(RED.multiply(0.0926*255)).add(NIR.multiply(0.056*255)).subtract(SWIR1.multiply(0.7629*255)).subtract(SWIR2.multiply(0.5388*255))
    var NDVI=(NIR.subtract(RED)).divide(NIR.add(RED));
    var NDSI=(BLU.subtract(SWIR1)).divide(GREEN.add(SWIR1));
    
    var BRIGTSOIL=((BLU.lt(0.27)).and(growing15)).or((BLU.lt(0.27)).and(growing14).and(  ((NIR.subtract(SWIR1)).gt(0.038)))); 
    
    var WATERSHAPE= ((BLU.subtract(GREEN)).gt(-0.2)).and(decreasing2345).and(WETNESS.gt(0)); //add other cond
    var OTHERWATERSHAPE= (BLUgteGREEN).and(GREENgteRED).and(NIR.gte(RED)).and(SWIR1.lt(NIR)).and(SWIR2.lte(SWIR1)).and(NIR.lt((RED).multiply(1.3)).and(NIR.lt(0.12)).and(SWIR1.lt(RED)).and(NIR.lte(GREEN)).and(NIR.gt(0.039)).and(WETNESS.gt(0))  ); //add other cond  07/10 (add replaced with and  :) and(NIR.lte(GREEN))
    
    var SNOWSHAPE=(min1234.gt(0.30)).and(NDSI.gt(0.65));
    
    var CLOUDSHAPE = ((SNOWSHAPE.eq(0)).and(BRIGTSOIL.eq(0))).and(
                  ((max123457.gt(0.47)).and(min1234.gt(0.37))).or(
                    
                    ((min123.gt(0.17)).and((SWIR1).gt(min123))).and(
                          ((SATURATION.gte(0.2)).and(SATURATION.lte(0.4)).and(max234.gte(0.35)) ).or ((NDSI.lt(0.65)).and(max1234.gt(0.30)).and( (NIR.divide(RED)).gte(1.3) ).and((NIR.divide(GREEN)).gte(1.3)).and( (NIR.divide(SWIR1)).gte(0.95)  )) 
                                                                   )
                                                                   
                                                                  ) 
                                                              ) 
    
    min123=0
    
    BRIGTSOIL=0
    SATURATION=0
    decreasing2345=0
    // main groups based on ndvi
    var ndvi_1 = NDVI.lte(th_NDVI_MAX_WATER);
    var ndvi_2 = NDVI.lt(th_NDVI_MIN_VEGE).and(ndvi_1.eq(0));
    var ndvi_3 = NDVI.gte(th_NDVI_MIN_VEGE);
    
    
    //-------------------------------------------------------------------------------------------------------------
		//----------------------  SECTION 1 : WATER  ---------------------------------------------------------
		//-------------------------------------------------------------------------------------------------------------
    
    OUT=(ndvi_1.and(SNOWSHAPE)).multiply(3);
    OUT=OUT.where( (ndvi_1).and(
                    (WATERSHAPE.and(BLU.gt(0.078)).and(GREEN.gt(0.04)).and(GREEN.lte(0.12)).and(max57.lt(0.04))).or(
                    (RED.gte(max457)).and(RED.lte(0.19)).and(RED.gt(0.04)).and(BLU.gt(0.078)).and(max57.lt(0.04))) ),8);
    
    
    OUT=OUT.where(( (ndvi_1).and(BLU.gt(0.94)).and(GREEN.gt(0.94)).and(RED.gt(0.94)).and(NIR.gt(0.94)) ),1);  // TEST CLOUDS L8
    
		OUT=OUT.where((OUT.eq(0)).and(ndvi_1),8);  // TE               
  
    //OUT=OUT.where((OUT.eq(0)).and(ndvi_1),41); 
    
    
    //-------------------------------------------------------------------------------------------------------------
		//---------------------  SECTION 2 : CLOUDS or SOIL  ---------------------------------------------------------
		//------------------------------------------------------------------------------------------------------------
    
     OUT=OUT.where(( (ndvi_2).and(SNOWSHAPE)),3);
    
     OUT=OUT.where(( (ndvi_2).and(OTHERWATERSHAPE).and(BLU.gt(0.078)).and(max57.lt(0.058))),8 );
    
     OUT=OUT.where(( (ndvi_2).and(
                      CLOUDSHAPE.or(
                      (BLUgtGREENgtRED.and(NIR.gt(0.254)).and( BLU.gt(0.165)).and(NDVI.lt(0.40))).or(
                      (BLUgtGREEN.and(BLU.gt(0.27)).and(GREEN.gt(0.21)).and( REDsubtractGREEN.lte(0.1)).and(NIR.gt(0.35)))).or(
                      (BLU.gt(0.94)).and(GREEN.gt(0.94)).and(RED.gt(0.94)).and(NIR.gt(0.94))))
                      
                      )),1);

    CLOUDSHAPE=0
 
     OUT=OUT.where(( (ndvi_2).and(BLU.lt(0.13)).and(BLUgtGREENgtRED).and(RED.lt(0.05)).and( BLUsubtractNIR.lt(-0.04))     ),40);    //similar 2 cl 42 simplify
     
     OUT=OUT.where(( (OUT.eq(0)).and(ndvi_2).and(WETNESS.gt(5))),8   ); //only at this point to avoid confusion with shadows
     WETNESS=0
   
     OUT=OUT.where(( (ndvi_2).and(BLU.lt(0.13)).and(BLUgtGREENgtRED).and(RED.lt(0.05)).and( BLUsubtractNIR.lt(0.04))        ),42   );
    
     OUT=OUT.where(( (OUT.eq(0)).and(ndvi_2).and(
                    ((BLU.lt(0.14)).and(BLU.gt(0.10)).and(BLUgtGREENgtRED).and(RED.lt(0.06)).and(NIR.lt(0.14)).and( ((NIR).subtract(BLU)).lt(0.02))).or(
                    ( ((((NIR.subtract(GREEN)).abs().lte(0.01)).add( BLUsubtractNIR.gte(0.01))).gt(0)).and(BLUgtGREENgtRED).and(NIR.gte(0.06)) )).or(
                    ( (OUT.eq(0)).and(ndvi_2).and(NDVI.lte(0.09)).and(NIR.lt(0.4)).and(GREENlteRED).and(REDlteNIR)) )
                   )),41);
  
     OUT=OUT.where(( (OUT.eq(0)).and(ndvi_2).and(NDVI.lte(0.20)).and(NIR.gt(0.3)).and(growing14)   ),34 );
     
     
     OUT=OUT.where(( (OUT.eq(0)).and(ndvi_2).and(NDVI.gte(0.35)).and(BLUgteGREEN).and(REDsubtractGREEN.lt(0.04))    ),21 );
     
     OUT=OUT.where(( (OUT.eq(0)).and(ndvi_2).and(NDVI.gte(0.20)).and( REDsubtractGREEN.lt(0.05))   ),30 );
     
     OUT=OUT.where(( (OUT.eq(0)).and(ndvi_2)),31);
     
     REDsubtractGREEN=0
     BLUgteGREEN=0
     
    //-------------------------------------------------------------------------------------------------------------
		//----------------------  SECTION 3 : VEGETATION  -------------------------------------------------------------
		//-------------------------------------------------------------------------------------------------------------
    
    var MyCOND=(ndvi_3).and(NDVI.lt(th_RANGELAND));
    OUT=OUT.where(( (MyCOND).and(NIR.gte(0.15)) ),21);
    OUT=OUT.where(( (MyCOND).and(NIR.lt(0.15))  ),40);
    
    MyCOND=(ndvi_3).and(NDVI.lt(th_GRASS));
    OUT=OUT.where(( (MyCOND).and(BLUlteNIR).and(NIR.lt(0.15))  ),40);
    OUT=OUT.where(( (OUT.eq(0)).and(
                                    ((MyCOND).and(BLUlteNIR)).or( (NDVI.lt(th_SHRUB) ).and(NIR.gt(0.22)))).and(NDSI.lt(-0.35))  ),16);
  
                                    
    OUT=OUT.where(( (MyCOND).and(BLU.gt(NIR)) ),40);
    OUT=OUT.where(( (OUT.eq(0)).and(MyCOND)).and(NDSI.lt(-0.3)),16);                                        
    OUT=OUT.where( (ndvi_3).and(OUT.eq(0)).and(NDSI.gt(-0.25))  ,10);
    
    OUT=OUT.where(((OUT.eq(0)).and(ndvi_3).and(NDVI.gt(th_TREES)) ),9);
    
    OUT=OUT.where(( (OUT.eq(0)).and(NDVI.lt(th_GRASS))),21);
    OUT=OUT.where(( (OUT.eq(0)).and(NDSI.lt(-0.25))),13);
    OUT=OUT.where(( (OUT.eq(0))),16);
    
   
   if (clouds_morpho_filter == 1){
         var CM=((OUT.eq(1)).or(OUT.eq(3)));                                                 // possible clouds 
         var SH=(OUT.gt(34));   //possible shadows 
         CM=CM.focal_max(clouds_filter_size,'circle','meters',1);                             
         var CMextent=CM.focal_max(600,'circle','meters',1);                                 // max distance of SH from CL --- better number can be defined usinf sun elevation
         OUT=OUT.where(((OUT.eq(8)).and(CMextent)),42);                                      // recode SH falling in the buffer to final SH class  
         CMextent=0;
         SH=SH.focal_max(shadow_filter_size,'circle','meters',1);
         var CM_SH=CM.add(SH.multiply(2)).select([0],["CSM"]);
         OUT=OUT.where(CM_SH.gte(1),1);
    }
   
    
    return (OUT.select([0],["Class"]).toByte());
    
   
}   // SINGLE DATE CLASSIFICATION
////////////////////////////////////////////////////////
///Lines 831-900: Vegetation and kelp indices 

var nbrFunctionKDI2 = function(image) {
  return image.addBands(image.expression(
    '(r6-b4)' , {
      b4: image.select('B4'),
      r6: image.select('B6'),
  }).rename('kd'));
};

var FAI = function(image) {
  return image.addBands(image.expression(
    '(B8- (B4 + (B11-B4)* ((0.833-0.665)/(1.612-0.665))))', {
      B8: image.select('B8'), 
      B4: image.select('B4'), 
      B11: image.select('B11')
}).rename('FAI')); 
}; 

var NDVIfunction = function(image) {
  return image.addBands(image.expression (
  '(B8-B4)/(B8+B4)', {
    B8: image.select('B8'), 
    B4: image.select('B4')
  }).rename('NDVI'));
}; 
var ave = alos.select('AVE')
var b11 = collectionS2_mod10000.select('B11')// B11 filter 
var sealevel = ave.eq(0); // ALOS Sea level filter. (ALOS DSM: Global 30m) It doesn't cover Chatham, Prince Edward, Tristan da Cunha, Gough Island and the extreme NW of South Georgia.
var seasrtm = srtm.eq(0); // SRTM for the areas not covered by ALOS. (SRTM Digital Elevation Data 30m)

var kd = nbrFunctionKDI2(collectionS2_mod10000).select('kd');  
var fai = FAI(collectionS2_mod10000).select('FAI');
var ndvi = NDVIfunction(collectionS2_mod10000).select('NDVI');

////// threshold values 
var maskedkd = kd.updateMask(kd.gte(0.003216)).updateMask(b11.lte(0.028)).updateMask(srtm.eq(0));  
var maskedfai = fai.updateMask(fai.gte(0.005352)).updateMask(b11.lte(0.028));
var maskedndvi = ndvi.updateMask(ndvi.gte(-0.0003411)).updateMask(b11.lte(0.028));


Map.addLayer(maskedkd, {palette:( 'orange')}, 'kd')
//Map.addLayer(maskedndvi, {palette:( 'green')}, 'ndvi' )
//Map.addLayer(maskedfai, {palette:( 'red')}, 'fai' )


////////////////////////
//////Export images to assets and Google Drive 
/*
Export.image.toAsset({
  image: maskedkd, //masked kd, ndvi or fai
  description: "writehere",
    assetId: "writehere",
  region: AOI,
  scale: 10, 
  maxPixels: 1e13
})
*/

/*
Export.image.toDrive({
  image: maskedfai, //masked kd, ndvi or fai
  description: "writehere",
  folder: "writehere",
  region: geometry, 
  scale: 10,   crs: 'EPSG:3857'

});
*/
