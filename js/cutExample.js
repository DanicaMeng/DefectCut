var FileData = function(result){
    this.lineArr = result.split('\r\n');
    //console.log(this.lineArr.length);
    this.index = 0;
    this.ReadLine = function(){
                        if(this.index < this.lineArr.length){
                        var line =  this.lineArr[this.index];
                        this.index ++;
                        return line;
                    }
                    return null;
    };
    
    this.AtEndOfStream = function(){
        return this.index >= this.lineArr.length;
    };
}


var ExampleData = Class.extend({
    init: function(file,type){
        var fileName = file.name.split(".")[0];
        console.log(fileName);
        if(window.FileReader){
            var reader = new FileReader();
            reader.onload = function() {
                //console.log('reader.onload ' + this.result);
                var f = new FileData(this.result);
                var data;
                if(type == 'old'){
                    data = new ExampleOldData(f);
                }else{
                    data = new ExampleNewData(f);
                }
                inputDataArr.push({filename:fileName,filetext:this.result,data:data});
            }
            reader.readAsText(file);
        }
    }
})
var ExampleOldData = Class.extend({
    init: function(f){
        var firstLineArr = f.ReadLine().split(' ');
        this.pRightTop = new Coordinate(parseInt(firstLineArr[0]),parseInt(firstLineArr[1]));
        //需要裁剪的布片
        this.pieceArr = new Array();
        var pieceNum = parseInt(firstLineArr[2]);
        for(var idx = 0; idx < pieceNum; idx++){
            var pieceLineArr = f.ReadLine().split(' ');
            this.pieceArr.push(new ClothPieces(parseInt(pieceLineArr[0]),parseInt(pieceLineArr[1]),parseInt(pieceLineArr[2])));
        }
        //破点
        this.breakingArr = new Array();
        while (!f.AtEndOfStream()){ 
            var str = f.ReadLine();
            if(str.trim().length <= 0){
                continue;
            }
            var breakingLineArr = str.split(' ');
            var pLeftBottom = new Coordinate(parseInt(breakingLineArr[0]),parseInt(breakingLineArr[1]));
            var pRightTop = new Coordinate(parseInt(breakingLineArr[2]),parseInt(breakingLineArr[3]));
            this.breakingArr.push(new Rectangle(pLeftBottom,pRightTop));
        } 
    }
});

var ExampleNewData = Class.extend({
    init: function(f){
        var firstLineArr = f.ReadLine().split(' ');
        this.pRightTop = new Coordinate(parseInt(firstLineArr[0]),parseInt(firstLineArr[1]));
        var secondLineArr = f.ReadLine().split(' ');
        //console.log(secondLineArr.join());
        //需要裁剪的布片
        var pieceNum = parseInt(secondLineArr[0]);
        this.pieceArr = new Array();
        for(var idx = 0; idx < pieceNum; idx++){
            var pieceLineArr = f.ReadLine().split(' ');
            this.pieceArr.push(new ClothPieces(parseInt(pieceLineArr[0]),parseInt(pieceLineArr[1]),parseInt(pieceLineArr[2])));
        }
        //破点
        var breakingNum = parseInt(secondLineArr[1]);
        this.breakingArr = new Array();
        for(var idx = 0; idx < breakingNum; idx++){
            var breakingLineArr = f.ReadLine().split(' ');
            var pLeftBottom = new Coordinate(parseInt(breakingLineArr[0]),parseInt(breakingLineArr[1]));
            var pRightTop = new Coordinate(parseInt(breakingLineArr[2]),parseInt(breakingLineArr[3]));
            this.breakingArr.push(new Rectangle(pLeftBottom,pRightTop));
        }
    }
});

//剪切的实例,进行剪切并得到最好的处理结果
var CutExample = function(data){
    //初始数据
    console.log("CutExample");
    console.log(data.breakingArr.length);
    console.log("pieceArr");
    console.log(data.pieceArr.length);
    this.cloth = new ClothRect(new Coordinate(0,0),data.pRightTop,data.breakingArr);//提供的布料
    this.pieceArr = data.pieceArr; //需要裁剪的布片
    //切割结果
    this.utilization = 0.000; //布料的使用率
    this.usedArea = 0; //布料的使用率
    this.cutResult = new Array();    //布料切割方式
    this.waitPieceArr = this.pieceArr.map(function(item){
        return item.copy();
    }); //待裁剪的布片
    this.finishPieceArr = new Array(); //已经裁剪出来的布片
    this.cutLineArr = new Array(); //裁剪布片时的线
    //切割
    this.cut = function() {
        //处理布料
        this.cloth.cut(new CutClothRectList());//注释掉本行，即为不对材料处理直接切割的做法
        var results = this.cloth.gatherCutResults();
        //计算出使用率最高的切割方式
        var usedArea = 0; //使用的布料
        var maxIndex = -1;       //最大使用率的切割方式在结果中的索引
        console.log("results numbre:"+ String(results.length));
        for(var idx = 0; idx < results.length; idx ++){
            //var usedResult = this.used(results[idx]);
            var usedResult = this.usedGreedy(results[idx]);
            /*console.log("usedResult" + 'index:' + String(idx) + " usedArea:"+ String(usedResult.usedArea) 
                 + ' finishPieceArr numbre:' + String(usedResult.finishPieces.length));*/
            if(usedResult.usedArea > usedArea){
                usedArea = usedResult.usedArea;
                maxIndex = idx;
                this.waitPieceArr = usedResult.waitPieces;
                this.finishPieceArr = usedResult.finishPieces;
                this.cutLineArr = usedResult.cutLineArr;
            }
        }
        //最终结果计算
        this.usedArea = usedArea;
        this.utilization = usedArea  / (this.cloth.pRightTop.x * this.cloth.pRightTop.y *1.00); 
        console.log('utilization:' + String(this.utilization));
        this.cutResult = results[maxIndex];
    };
    //对需要裁剪的补片进行先宽度再高度的排序
    this.seqPieceArr = this.pieceArr.map(function(item){
        return item.copy();
    });
    this.seqPieceArr.sort(function(a,b){
        if(a.width == b.width){
            return b.height - a.height;
        }else{
            return b.width - a.width;
        }
        //改为按面积排序
        //return b.width * b.height - b.width * b.height;
    });
    //对cutResult中切割出的布块进行使用，排序切割
    this.used = function (cutResult) {
        var waitPieceArr = this.seqPieceArr.map(function(item){
            return item.copy();
        }); //待裁剪的布片
        var finishPieceArr = new Array(); //已经裁剪出来的布片
        var usedArea = 0;
        var cutLineArr = new Array(); //剪切的线
        //对cutResult.clothRectArr中布块，进行先宽度再高度的从大到小的排序
        clothRectArr = cutResult.clothRectArr.concat();
        var sortFun = function(a,b){
            var aWidth = a.getWidth();
            var bWidth = b.getWidth();
            if( aWidth == bWidth){
                return b.getHeight() - a.getHeight();
            }else{
                return bWidth - aWidth;
            }
            //改为按面积排序
            //return b.getWidth() * b.getHeight() - a.getWidth() * a.getHeight();
        };
        clothRectArr.sort(sortFun);
        //变量排序后的cutResult.clothRectArr，并依次使用
        for(var idx = 0; idx < clothRectArr.length; idx++){
            //console.log('clothRectArr.length:' + String(clothRectArr.length))
            var cloth = clothRectArr[idx];
            var clothWidth = cloth.getWidth();
            var clothHeight = cloth.getHeight();
            //找到宽度和高度最接近的带布块
            var piecesIdx = 0
            for(; piecesIdx < waitPieceArr.length; piecesIdx++){
                if(waitPieceArr[piecesIdx].width <= clothWidth && waitPieceArr[piecesIdx].height <= clothHeight){
                    break;
                }
            }
            if(piecesIdx >= waitPieceArr.length){
                //当前布块不能使用
                continue;
            } else{
                var piece = waitPieceArr[piecesIdx];
                
                //剪切,先横切，再竖切
                var usedCloth =  new Rectangle(cloth.pLeftBottom,
                    new Coordinate(cloth.pLeftBottom.x + piece.width,cloth.pLeftBottom.y + piece.height));
                var remainCloth1 = new Rectangle(new Coordinate(cloth.pLeftBottom.x,cloth.pLeftBottom.y + piece.height),
                        cloth.pRightTop);    
                var remainCloth2 = new Rectangle(new Coordinate(cloth.pLeftBottom.x + piece.width,cloth.pLeftBottom.y),
                        new Coordinate(cloth.pRightTop.x,cloth.pLeftBottom.y + piece.height));

                //修改待裁剪布块和已裁剪布块列表
                finishPieceArr.push({piece:new ClothPieces(piece.width,piece.height,1),porsion:usedCloth});
                usedArea = usedArea + piece.width * piece.height;
                if(piece.numbre > 1){
                    piece.numbre = piece.numbre -1;
                }else{
                    waitPieceArr.splice(piecesIdx,1);
                }
                
                //整理剩余所有布料
                if(idx < clothRectArr.length){
                    clothRectArr = clothRectArr.slice(idx+1);
                }else{
                    clothRectArr = new Array();
                }
                if(remainCloth1.isRectangle()){
                    //console.log('remainCloth1.isRectangle()');
                    clothRectArr.push(remainCloth1);
                }
                if(remainCloth2.isRectangle()){
                    clothRectArr.push(remainCloth2);
                }
                clothRectArr.sort(sortFun);
                idx = -1;//自加后从0开始
            } 
        }
        return {usedArea:usedArea,finishPieces:finishPieceArr,waitPieces:waitPieceArr,cutLineArr:cutLineArr};
    };
    this.usedGreedy = function (cutResult) {
        var waitPieceArr = this.seqPieceArr.map(function(item){
            return item.copy();
        }); //待裁剪的布片
        var finishPieceArr = new Array(); //已经裁剪出来的布片
        var usedArea = 0;
        var cutLineArr = new Array(); //剪切的线
        //布块
        clothRectArr = cutResult.clothRectArr.concat();
        var clothSurplusArr = new Array();
        function surplus_1(){ //为可用布料找一块最匹配的需要布料
            clothSurplusArr.splice(0);
            for(var idx = 0; idx < clothRectArr.length; idx++){
            //console.log('clothRectArr.length:' + String(clothRectArr.length))
                var cloth = clothRectArr[idx];
                var clothWidth = cloth.getWidth();
                var clothHeight = cloth.getHeight();
                var surplusValue = clothWidth + clothHeight;
                var fidPieceIdx = -1;
                //找到宽度和高度最接近的需求的布块
                for(var piecesIdx = 0; piecesIdx < waitPieceArr.length; piecesIdx++){
                    var tempSurplusWidth = clothWidth - waitPieceArr[piecesIdx].width;
                    var tempSurplusHeight = clothHeight - waitPieceArr[piecesIdx].height;
                    if(tempSurplusWidth >= 0 && tempSurplusHeight >= 0){
                        var tempSurplus = tempSurplusWidth <= tempSurplusHeight ? tempSurplusWidth : tempSurplusHeight;
                        if(tempSurplus < surplusValue){
                            surplusValue = tempSurplus;
                            fidPieceIdx = piecesIdx;
                            if(surplusValue == 0){
                                break;
                            }
                        }
                    }
                }
                clothSurplusArr[idx] = {surplusValue:surplusValue,fidPieceIdx:fidPieceIdx};
                if(surplusValue == 0){
                    break;
                }
            }
        }
         function surplus_2(){ //为需要布料找一块最匹配的可用布料
            clothSurplusArr.splice(0,clothSurplusArr.length);
            for(var idx = 0; idx < clothRectArr.length; idx++){
            //console.log('clothRectArr.length:' + String(clothRectArr.length))
                var cloth = clothRectArr[idx];
                var clothWidth = cloth.getWidth();
                var clothHeight = cloth.getHeight();
                var surplusValue = clothWidth + clothHeight;
                var fidPieceIdx = -1;
                //找到宽度和高度最接近的需求的布块
                for(var piecesIdx = 0; piecesIdx < waitPieceArr.length; piecesIdx++){
                    var tempSurplusWidth = clothWidth - waitPieceArr[piecesIdx].width;
                    var tempSurplusHeight = clothHeight - waitPieceArr[piecesIdx].height;
                    if(tempSurplusWidth >= 0 && tempSurplusHeight >= 0){
                        var tempSurplus = tempSurplusWidth <= tempSurplusHeight ? tempSurplusWidth : tempSurplusHeight;
                        if(tempSurplus < surplusValue){
                            surplusValue = tempSurplus;
                            fidPieceIdx = piecesIdx;
                            if(surplusValue == 0){
                                break;
                            }
                        }
                    }
                }
                clothSurplusArr[idx] = {surplusValue:surplusValue,fidPieceIdx:fidPieceIdx};
                if(surplusValue == 0){
                    break;
                }
            }
        }
        function cutOnePiece(){
            var clothIdx = -1;
            clothSurplusArr.map(function (item,index){
                if(clothIdx < 0 && item.fidPieceIdx >= 0){
                    clothIdx = index;
                } else if(item.surplusValue < clothSurplusArr[clothIdx.surplusValue] && item.fidPieceIdx >= 0){
                //} else if(item.surplusValue < clothSurplusArr[clothIdx].surplusValue && item.fidPieceIdx >= 0){
                
                    clothIdx = index;
                }
            });
            if(clothIdx < 0){
                //所有剩余布料无法切割
                
                return false;
            }
            surplusdata = clothSurplusArr[clothIdx];
            var piece = waitPieceArr[surplusdata.fidPieceIdx];
            var cloth = clothRectArr[clothIdx];
            //console.log('clothRectArr length:' + String(clothRectArr.length) + ' clothIdx:' + String(clothIdx) );
            var clothWidth = cloth.getWidth();
            var clothHeight = cloth.getHeight();
            var remainCloth1;
            var remainCloth2;
            if(clothWidth == piece.width && clothHeight == piece.height){
                //大小相等，不需要切线，没有剩余布料
            } else if(cloth.getHeight() - piece.height == surplusdata.surplusValue){
                //高度接近，先竖起，再横切
                //竖切一次
                 remainCloth1 = new Rectangle(new Coordinate(cloth.pLeftBottom.x + piece.width,cloth.pLeftBottom.y),
                        cloth.pRightTop );
                 cutLineArr.push(new CutLine(new Coordinate(cloth.pLeftBottom.x + piece.width,cloth.pLeftBottom.y),
                    new Coordinate(cloth.pLeftBottom.x + piece.width,cloth.pRightTop.y)));
                
                if(surplusdata.surplusValue != 0){
                    //需要横切
                    remainCloth2 = new Rectangle(new Coordinate(cloth.pLeftBottom.x,cloth.pLeftBottom.y + piece.height),
                        new Coordinate(cloth.pLeftBottom.x + piece.width ,cloth.pRightTop.y));    
                    cutLineArr.push(new CutLine(new Coordinate(cloth.pLeftBottom.x,cloth.pLeftBottom.y + piece.height),
                        new Coordinate(cloth.pLeftBottom.x + piece.width,cloth.pLeftBottom.y + piece.height)));
                }
            } else{
                //宽度更接近，先横切，再竖切 
                //横切一次
                remainCloth1 = new Rectangle(new Coordinate(cloth.pLeftBottom.x,cloth.pLeftBottom.y + piece.height),
                        cloth.pRightTop);    
                cutLineArr.push(new CutLine(new Coordinate(cloth.pLeftBottom.x,cloth.pLeftBottom.y + piece.height),
                    new Coordinate(cloth.pRightTop.x,cloth.pLeftBottom.y + piece.height)));
                if(surplusdata.surplusValue != 0){
                    //需要竖切
                    remainCloth2 = new Rectangle(new Coordinate(cloth.pLeftBottom.x + piece.width,cloth.pLeftBottom.y),
                        new Coordinate(cloth.pRightTop.x,cloth.pLeftBottom.y + piece.height));
                    cutLineArr.push(new CutLine(new Coordinate(cloth.pLeftBottom.x + piece.width,cloth.pLeftBottom.y),
                        new Coordinate(cloth.pLeftBottom.x + piece.width,cloth.pLeftBottom.y + piece.height)));
                } 
            }
            var usedCloth =  new Rectangle(cloth.pLeftBottom,
                    new Coordinate(cloth.pLeftBottom.x + piece.width,cloth.pLeftBottom.y + piece.height));
            //修改待裁剪布块和已裁剪布块列表
                finishPieceArr.push({piece:new ClothPieces(piece.width,piece.height,1),porsion:usedCloth});
                usedArea = usedArea + piece.width * piece.height;
                //console.log("usedArea:" + String(usedArea));
                if(piece.numbre > 1){
                    piece.numbre = piece.numbre -1;
                }else{
                    waitPieceArr.splice(surplusdata.fidPieceIdx,1);
                }
            //整理剩余所有布料   
            clothRectArr.splice(clothIdx,1);
            if(remainCloth1 != undefined && remainCloth1.isRectangle()){
                    clothRectArr.push(remainCloth1);
                }
                if(remainCloth2 != undefined && remainCloth2.isRectangle()){
                    clothRectArr.push(remainCloth2);
                }
            return true;
        };
        surplus_1();
        while(clothRectArr.length > 0 && waitPieceArr.length > 0 && cutOnePiece()){
            surplus_1();
        }
        return {usedArea:usedArea,finishPieces:finishPieceArr,waitPieces:waitPieceArr,cutLineArr:cutLineArr};
    };
    this.drowCutResult = function (ctx){
        ctx.beginPath();
        ctx.strokeStyle = "#FF0000";
        ctx.rect(0,0,this.cloth.pRightTop.x,this.cloth.pRightTop.y);
        ctx.stroke();
        //画坏点
        this.cloth.breakingArr.map(function(item){
            item.drow(ctx);
        });
        //画切割线
        this.cutResult.drow(ctx);
  
    };
    this.drowUsed = function (ctx) {
        ctx.beginPath();        
        ctx.strokeStyle = "#FF0000";
        ctx.rect(0,0,this.cloth.pRightTop.x,this.cloth.pRightTop.y);
        ctx.stroke();
        //画完成的布料
        this.finishPieceArr.map(function(item,index){
            item.porsion.drow(ctx,"#0fcc0f",index+1);
            ctx.beginPath(); 
            ctx.strokeStyle = "#00EEEE";
            ctx.rect(item.porsion.pLeftBottom.x,item.porsion.pLeftBottom.y,item.piece.width,item.piece.height);
            ctx.stroke(); 
        });
        //画坏点
        this.cloth.breakingArr.map(function(item){
            item.drow(ctx);
        });
        this.cutLineArr.map(function(item){
            item.drow(ctx);
        });
    }
}