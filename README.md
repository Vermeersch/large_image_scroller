large_image_scroller
====================

A javascript engine using Create.js to scroll large format images.
This is a script which will allow the viewing of really really really big images through the browser. Images must first be cut into tiles, tested at up to 16000x16000 pixels cut into 100 tiles.


NOTE: Does not work from local load due to security sandbox issues. Must be accessed through http.

//

File prep:

1. Open empty_grid.psd
2. import the image you'd like to scroll
3. size it accordingly
4. Save For Web. It should automatically export all of the sliced images.
5. in index.html update the init() function to reflect your new file name.

Alt.

Follow the directions on this page for any image. Keep the below listed limitations in mind:
http://angelb.wordpress.com/2009/01/14/how-to-slice-up-a-map-evenly-using-grid-and-slice-tool-in-photoshop-cs4-brief-tutorial/


Getting fancier:

The script will accept any number and size of grid as long as you follow these restrictions:

The tiles must all be the same size.
The tiles should be under 1024 px in any direction. Some mobile browsers choke on larger files. Newer mobile browsers choke on 2048 and larger.
The script will automagically assemble the grid based on the sizing of the first tile.
You can vary the number of tiles high and wide.
