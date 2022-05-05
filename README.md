# kelp_forests

A high-resolution global map of giant kelp (Macrocystis pyrifera) forests and intertidal green algae (Ulvophyceae) with Sentinel-2 images.


Mora-Soto, A.; Palacios, M.; Macaya, E.C.; Gómez, I.; Huovinen, P.; Pérez-Matus, A.; Young, M.; Golding, N.; Toro, M.; Yaqub, M.; Macias-Fauria, M. A High-Resolution Global Map of Giant Kelp (Macrocystis pyrifera) Forests and Intertidal Green Algae (Ulvophyceae) with Sentinel-2 Imagery. Remote Sens. 2020, 12, 694.

The global map can be seen here: 
https://biogeoscienceslaboxford.users.earthengine.app/view/kelpforests

This is a repository with supplementary material for this paper. The contents are: 



Kelp detection algorithm (JS code); (Copy and paste in your GEE API; define a geometry and hit run)
https://code.earthengine.google.com/56274005f03809a9611eaec8f0fc95cf
You can activate the NDVI and FAI indices deleting the (//) in lines 877 and  878. 
The option to export your kelp canopy map to your own Google Drive repository is in lines 884-891. 
You can also download them from your Google Drive activating lines 895-902. 

Low resolution kelp observations (table);

Methodology workflow; 

Figure thresholds: Box and whisker plot of NDVI, FAI and KD per class derived from training data. Threshold values are indicated by a red line; values under those thresholds were masked out. GA= Green Algae; OW= Organic water; RG: River grass.; 

Alternative validation using random forests and CART (pptx); Validation compared to NDVI, FAI and KD (.xlsx); 

The high resolution validation with UAV images can be seen here: 
https://biogeoscienceslaboxford.users.earthengine.app/view/kelp-forests-uav

Questions? drop me a line at alemoras@uvic.ca
updated: May 2022
