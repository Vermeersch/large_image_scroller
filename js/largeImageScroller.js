var canvas;
		var stage;
		//
		var _SW;
		var _SH;
		//
		var siteloaded = false;
		//
		var tracer;
		var menu_mc;
		var backing_mc;
		var backing_holder_mc;
		//
		//MENU
		//
		var mouse_explore = true
		//
		var gyro_moved = false;
		var gyro_explore = false
		var gyro_alpha;
  		var gyro_beta;
  		var gyro_gamma;
		//
		var base_gyro_alpha;
		var base_gyro_beta;
		var base_gyro_gamma;
		//
		//BLOCK |----|
		var block_width;
		var block_height;
		//
		////PLATE |----||----||----||----|
		var plate_width;
		var plate_height;
		//
		//VIEWPORT  |----||--X-||--X-||----|
		var viewport_width;
		var viewport_height;
		var viewport_x;
		var viewport_y;
		//
		var viewport_destX_percent=.5;
		var viewport_destY_percent=.5;
		var viewport_x_percent=0;
		var viewport_y_percent=0
		//
		var plateArray = new Array();
		function init(s_path,num_wide,num_hi) {
			window.navigator.standalone = true;
			window.scrollTo(0, 1); 
			//
			_SW = window.innerWidth;
			_SH = window.innerHeight;
			//
			canvas = document.getElementById("canvas");
			canvas.width  = _SW;
  			canvas.height = _SH;
			//
			stage = new createjs.Stage(canvas);
			//enable touch
			createjs.Touch.enable(stage);
			//enable mouseover
			stage.enableMouseOver(10);
			stage.mouseMoveOutside = true;
			//
			_SW = canvas.width;
			_SH = canvas.height;
			//
			var nowImageID = 0;
			for(var i=0;i<num_hi;i++){
				var holdArray = new Array();
				for(var j=0;j<num_wide;j++){
					nowImageID++
					var nowImageString = nowImageID.toString()
					if(nowImageString.length==1){
						nowImageString = "0"+nowImageString;
					}
					holdArray.push({src:s_path+nowImageString+".jpg"})
				}
				plateArray.push(holdArray)
			}
			//
			backing_mc = new createjs.Container();
			stage.addChild(backing_mc);
			
			//
			createjs.Ticker.setFPS(30);
			createjs.Ticker.addEventListener("tick", tick);
			//update = true;
			//
			loadAssets();
		}
		//
		function set_viewport_target(s_x,s_y){
			viewport_destX_percent = s_x;
			viewport_destY_percent = s_y;
		}
		//#####################################################
		//LOAD EVERYTHING
		//
		function loadAssets(){
			var loadID = 0;
			//
			//VISUAL LOADER
			loader_mc = new createjs.Shape();
 			loader_mc.graphics.beginFill("#0099CC").drawRect(0, _SH-3, _SW, 3);
			stage.addChild(loader_mc);
			//
			queue = new createjs.LoadQueue(true);
			queue.addEventListener("fileload", handle_loadAsset_Complete);
			//
			for(i=0;i<plateArray.length;i++){
				for(j=0;j<plateArray[i].length;j++){
					plateArray[i][j].id = loadID;
					queue.loadFile({id:loadID.toString(), src:plateArray[i][j].src});
					loadID++;
				}
			}
			queue.load();
		}
		function handle_loadAsset_Complete(e){
			var imageID = e.item.id;
			for(i=0;i<plateArray.length;i++){
				for(j=0;j<plateArray[i].length;j++){
					if(plateArray[i][j].id == imageID){
						plateArray[i][j].bmp = e.result;
						break;
					}
				}
			}
			loader_mc.scaleX = imageID/(plateArray.length * plateArray[0].length)
			//
			//ONCE ALL ARE LOADED
			if(imageID>=(plateArray.length * plateArray[0].length)-1){
				stage.removeChild(loader_mc);
				loader_mc = null;
				buildSite();
			}
		}
		function buildSite(){
			
			//SET VARIABLES TO BE USED IN UPDATING
		
			//BLOCK |----|
			//A Block is an individual tile
			block_width = plateArray[0][0].bmp.width;
			block_height = plateArray[0][0].bmp.height;
			
			console.log(block_width);
			//
			//PLATE |----||----||----||----|
			//The plate is the entire assembled large image
			var plate_width = block_width*plateArray[0].length;
			var plate_height = block_height*plateArray.length;
			// 
			//VIEWPORT  |----||--X-||--X-||----|
			//The Viewport is what the user sees
			viewport_width = _SW;
			viewport_height = _SH;
			//
			//the width and heigth we will scroll the viewport
			total_x0_range = plate_width-viewport_width
			total_y0_range = plate_height-viewport_height
			//
			updateBacking(.5,.5);
			determineNewContent();
			
			siteloaded = true;
			update = true;
		}
		//SNIFFS TO SEE F WE USE THE GYRO OR THE MOUSE
		function determineNewContent(){
			//
			//Sniffing is a bit bunk. SOme browsers say that the motion event is there when it actually isn't
			mouse_explore = true;
			//
			if (window.DeviceMotionEvent==undefined) {
				gyro_explore = false
			}else{
				gyro_explore = true
				window.addEventListener('deviceorientation', readGyro);
			}
		}
		//
		//############################################
		//UPDATES THE DRAWN BITMAP
		//
		function updateBacking(s_x_percent,s_y_percent){
			//-------------------------
			//REMOVE OLD HOLDER
			if(backing_holder_mc){
				backing_mc.removeChild(backing_holder_mc);
				backing_holder_mc = null;
			}
			//
			//CREATE NEW HOLDER
			backing_holder_mc = new createjs.Container();
			//
			//CALCUATE X/Y PERCENT
			viewport_x_percent = s_x_percent;
			viewport_y_percent = s_y_percent;
			//
			//THE CO-ORDS OF THE VIEW PORT
			viewport_x0 = Math.floor(total_x0_range*s_x_percent);
			viewport_y0 = Math.floor(total_y0_range*s_y_percent);
			viewport_x1 = Math.floor(viewport_x0+viewport_width);
			viewport_y1 = Math.floor(viewport_y0+viewport_height);
			//
			var draw_width = 0
			var draw_height = 0
			//
			//FIND INTERSECTING BLOCKS
			var numDrawn = 0;
			for(i = 0;i<plateArray.length; i++){
				//DETERMINES THE Y CUT
				//
				var block_y0 = i*block_height;
				var block_y1 = block_y0+block_height;
				//
				var crop_y0 = viewport_y0-block_y0;
				var crop_y1 = viewport_y1-block_y0;
				crop_y0 = Math.max(Math.min(crop_y0,block_height),0);
				crop_y1 = Math.max(Math.min(crop_y1,block_height),0);
				//
				var crop_height = Math.min(crop_y1-crop_y0,viewport_height)
				//
				if(crop_height>0){
					var draw_y = draw_height;
					draw_height+=crop_height
					draw_width = 0;
					//
					for(j = 0;j<plateArray[i].length;j++){
						
						//DETERMINES THE x CUT
						var block_x0 = j*block_width;
						var block_x1 = block_x0+block_width;
	
						//CHECKS THAT THE LEFT EDGE WILL BE CROPPED IN FROM ZERO
						var crop_x0 = viewport_x0-block_x0;
						var crop_x1 = viewport_x1-block_x0;
						crop_x0 = Math.max(Math.min(crop_x0,block_width),0);
						crop_x1 = Math.max(Math.min(crop_x1,block_width),0);
						
						var crop_width = Math.min(crop_x1-crop_x0,viewport_width);
	
						if(crop_width>0){
							var draw_x = draw_width;
							draw_width+=crop_width;
							//
							var now_bmp = new createjs.Bitmap(plateArray[i][j].bmp);
							now_bmp.sourceRect = new createjs.Rectangle(crop_x0,crop_y0,crop_width,crop_height);
							//
							now_bmp.x = draw_x;
							now_bmp.y = draw_y;
							//
							backing_holder_mc.addChild(now_bmp);
							numDrawn++
						}
					}
				}	
			}
			backing_mc.addChild(backing_holder_mc);
		}
		function readGyro(e){
			//
			//Grabs the gyro info when it moves
			gyro_alpha = e.alpha
  			gyro_beta = e.beta-30;
  			gyro_gamma = e.gamma
			//
			//This tells the tick function to use gyro info
			gyro_moved = true;
		}
		function tick() {	
			//update = false;
			if(siteloaded==true){
				var easeDelayRatio=10
				//
				if(gyro_moved==true){
					var now_x_percent = Math.min(Math.max(viewport_x_percent+gyro_gamma/360,0),1);
					var now_y_percent = Math.min(Math.max(viewport_y_percent+gyro_beta/360,0),1);
					//gyro_moved = false;
				}else if(mouse_explore==true){
					var now_x_percent = stage.mouseX/_SW;
					var now_y_percent = stage.mouseY/_SH;
				}else{
					var now_x_percent = viewport_destX_percent;
					var now_y_percent = viewport_destY_percent;
				}
				//
				var x_diff = now_x_percent-viewport_x_percent;
				var y_diff = now_y_percent-viewport_y_percent;
				if(Math.abs(x_diff)>.001 || Math.abs(y_diff)>.001){
					updateBacking(viewport_x_percent+x_diff/easeDelayRatio,viewport_y_percent+y_diff/easeDelayRatio)
				}
			}
			stage.update();
		}