//require("class.js");
//矩形
var Rectangle = Class.extend({
    init: function(pLeftBottom,pRightTop){
        //添加属性
        this.type = "Rectangle";
        this.pLeftBottom = pLeftBottom;   //左下角坐标点
        this.pRightTop = pRightTop;       //右上角坐标点
        //算出另外两个点坐标
        //this.pLeftTop = new Coordinate(pLeftBottom.x,pRightTop.y);     //左上角坐标点
        //this.pRightBottom = new Coordinate(pRightTop.x,pLeftBottom.y); //右下角坐标点
    },
    //方法
    getWidth: function(){
        return this.pRightTop.x - this.pLeftBottom.x;
    },
    getHeight: function(){
        return this.pRightTop.y - this.pLeftBottom.y;
    },
    //判断是否相同
    isSame: function(rectangle){
        return this.pLeftBottom.isSame(rectangle.pLeftBottom) && this.pRightTop.isSame(rectangle.pRightTop);
    },
    isRectangle: function(rect) {
        if(this.pLeftBottom.x <= this.pRightTop.x && this.pLeftBottom.y <= this.pRightTop.y){
            return true;
        }else
        {
            return false;
        }
    },
    overlapping: function(rect) {
        var ovlpRect;
        if(this.pLeftBottom.x >= rect.pRightTop.x || this.pRightTop.x <= rect.pLeftBottom.x //水平方向在布块之外，所以在布块范围之外，
        || this.pLeftBottom.y >= rect.pRightTop.y || this.pRightTop.y <= rect.pLeftBottom.y){//垂直方向在布块范围之外，所以在布块范围之外，
            
            ovlpRect = new Rectangle(new Coordinate(0,0),new Coordinate(-1,-1));
        }else {
            //左下角取两个左下角坐标值大的值
            leftX = this.pLeftBottom.x > rect.pLeftBottom.x ? this.pLeftBottom.x : rect.pLeftBottom.x;
            bottomY = this.pLeftBottom.y > rect.pLeftBottom.y ? this.pLeftBottom.y : rect.pLeftBottom.y;
            //右上角取两个右上角坐标值小的值
            rigthX = this.pRightTop.x < rect.pRightTop.x ? this.pRightTop.x : rect.pRightTop.x;
            topY = this.pRightTop.y < rect.pRightTop.y ? this.pRightTop.y : rect.pRightTop.y;
            
            ovlpRect = new Rectangle(new Coordinate(leftX,bottomY),new Coordinate(rigthX,topY));
        }
        return ovlpRect;
    },
    join: function () {
        return '[' + this.pLeftBottom.join() + ' , ' + this.pRightTop.join() + ']';
    },
    drow: function (ctx,color,index){
        ctx.beginPath();
        if(color != undefined){
            ctx.fillStyle = color;
        }
        ctx.fillRect(this.pLeftBottom.x,this.pLeftBottom.y,this.pRightTop.x - this.pLeftBottom.x,this.pRightTop.y - this.pLeftBottom.y);

        if(index != undefined){
           ctx.fillStyle = "#000000";
           ctx.fillText(index,(this.pLeftBottom.x + this.pRightTop.x)/2 , (this.pLeftBottom.y + this.pRightTop.y)/2); 
        }
    }
});
//布料
var ClothRect = Rectangle.extend({
    init: function(pLeftBottom,pRightTop,breakingArr){
        Rectangle.prototype.init.call(this,pLeftBottom,pRightTop);
        this.type = "ClothRect";
        this.breakingArr = breakingArr;  //该布料上的破点
        this.cutResultArr = new Array();   //切割结果数据，每一项都是CutResult类型，代表一种切割方式
    },
    //切割
    cut: function (cutClothRectList,level) {
        /*
        1、检查当前块是否有破点：无则直接执行4；有则执行2；
        2、将breakingArr中的破点依次作为第一切割点进行边的全排列切割，分别得到CutResult,放入cutResultArr
        3、对cutResultArr中的每项CutResult中的clothRectArr里的每个ClothRect进行检查，
        是否在已切割列表中存在该块:存在则直接拷贝breakingArr和cutResulrArr属性,执行4；
        不存在则设置该ClothRect的breakingArr属性（即breakingArr的破点是否在该ClothRect中，有多少），
        对该ClothRect调用 cut 方法进行切割。
        4、将当前对象放入已切割布料的列表中，
        */
        if(level == undefined){
            level = 1;
        }
        //console.log(level);
        if(this.breakingArr === undefined || this.breakingArr === null || this.breakingArr.length <= 0)
        {
            //cutClothRectList.addCutClothRect(this);
        }else{
            for(var idx = 0; idx < this.breakingArr.length; idx++){
                var cutResultList = this.cutBybreaking(idx,level <= 1);
                for(var idx1 = 0; idx1 < cutResultList.length; idx1++)
                {
                    var cutResult = cutResultList[idx1];
                    
                for(var idxCloth = 0; idxCloth < cutResult.clothRectArr.length; idxCloth++){
                    var item = cutResult.clothRectArr[idxCloth];
                    // //检测是否已经切割过
                    // var isCutClothRect = cutClothRectList.isCutClothRect(item);
                    // if(isCutClothRect.isCut){
                    //     //切割过
                    //     item.breakingArr = isCutClothRect.clothRect.breakingArr;
                    //     item.cutResultArr = isCutClothRect.clothRect.utResultArr
                    // }else{
                        //未切割过
                        //计算childRect的破点，
                        for(var index = 0; index < this.breakingArr.length; index++){
                            //破点与clothRect有重叠区域，重叠区域即新的破点
                            var newBRect = item.overlapping(this.breakingArr[index]);
                            if(newBRect.isRectangle()){
                                item.breakingArr.push(newBRect);
                            }
                        }
                        //进行切割
                        item.cut(cutClothRectList,level + 1);
                    // }
                }
                this.cutResultArr.push(cutResult);
                }
            }
        }  
    },
    cutBybreaking: function (idx,isAll) {
        var breakingRect = this.breakingArr[idx];
        //破点的边
        var tempSide = new Array();
        
        if(breakingRect.pRightTop.y == breakingRect.pLeftBottom.y || breakingRect.pRightTop.x == breakingRect.pLeftBottom.x){
            //破点为一条横向线 或者 为一条竖向线
            var side = new CutLine(breakingRect.pLeftBottom,breakingRect.pRightTop);
            tempSide.push(side);
        } else {
            if(breakingRect.pLeftBottom.x != this.pLeftBottom.x){
            //破点左侧不贴边，需要裁剪
            var leftSide = new CutLine(breakingRect.pLeftBottom,new Coordinate(breakingRect.pLeftBottom.x,breakingRect.pRightTop.y));
            tempSide.push(leftSide);
        }
        if(breakingRect.pLeftBottom.y != this.pLeftBottom.y){
            //破点底边不贴边，需要裁剪
            var bottomSide = new CutLine(breakingRect.pLeftBottom,new Coordinate(breakingRect.pRightTop.x,breakingRect.pLeftBottom.y));
            tempSide.push(bottomSide);
        }
        if(breakingRect.pRightTop.x != this.pRightTop.x){
            //破点右侧不贴边，需要裁剪
            var rightSide = new CutLine(new Coordinate(breakingRect.pRightTop.x,breakingRect.pLeftBottom.y),breakingRect.pRightTop);
            tempSide.push(rightSide);
        }
        if(breakingRect.pRightTop.y != this.pRightTop.y){
            //破点底边不贴边，需要裁剪
            var topSide = new CutLine(new Coordinate(breakingRect.pLeftBottom.x,breakingRect.pRightTop.y),breakingRect.pRightTop);
            tempSide.push(topSide);
        }
        }
        var breakingSideArr = null;
        //根据isAll确实是否破点四边进行全排列
        if(isAll){
             breakingSideArr = permutation(tempSide);
        }else{
            breakingSideArr = new Array();
            breakingSideArr.push(tempSide);
        }
        //console.log('isAll : ' + String(isAll) + 'breakingSideArr.length: ' + String(breakingSideArr.length));
        //根据全排列进行切割
        var cutResultArr = new Array();
       for(var idx = 0; idx < breakingSideArr.length; idx ++ ){
           var breakingSidelist = breakingSideArr[idx];
           //按照当前序列切割
           var cutRect = this;
           var cutResult = new CutResult();
           for(var idx2 =0; idx2 < breakingSidelist.length;idx2++){
               var side = breakingSidelist[idx2];
               //console.log(side.join());
               if(side.pStart.y == side.pEnd.y){
                   //横向切割
                   var leftCoordinate = new Coordinate(cutRect.pLeftBottom.x,side.pStart.y);
                   var rightCoordinate = new Coordinate(cutRect.pRightTop.x,side.pStart.y);
                   cutResult.cutLineArr.push(new CutLine(leftCoordinate,rightCoordinate));
                  var rectTop = new ClothRect(leftCoordinate,cutRect.pRightTop,new Array());
                  var rectBottom = new ClothRect(cutRect.pLeftBottom, rightCoordinate,new Array());
                  if(side.pStart.y == breakingRect.pLeftBottom.y && side.pStart.y == breakingRect.pRightTop.y){
                      //破点为一条线
                      cutRect = null;
                      cutResult.clothRectArr.push(rectTop);
                      cutResult.clothRectArr.push(rectBottom);
                  } else if(side.pStart.y == breakingRect.pLeftBottom.y){
                      //根据破点底边切割，所以对rectTop继续切割
                      cutRect = rectTop;
                      cutResult.clothRectArr.push(rectBottom);
                  }else{
                      //根据破点底边切割，所以对rectBottom继续切割
                      cutRect = rectBottom;
                      cutResult.clothRectArr.push(rectTop);
                  }
               }else if(side.pStart.x == side.pEnd.x){
                   //竖向切割
                   var bottomCoordinate = new Coordinate(side.pStart.x,cutRect.pLeftBottom.y);
                   var topCoordinate = new Coordinate(side.pStart.x,cutRect.pRightTop.y);
                   cutResult.cutLineArr.push(new CutLine(bottomCoordinate,topCoordinate));
                   var rectLeft = new ClothRect(cutRect.pLeftBottom,topCoordinate,new Array());
                  var rectRight = new ClothRect(bottomCoordinate, cutRect.pRightTop,new Array());
                  if(side.pStart.y == breakingRect.pLeftBottom.y && side.pStart.y == breakingRect.pRightTop.y){
                      //破点为一条线
                      cutRect = null;
                      cutResult.clothRectArr.push(rectLeft);
                      cutResult.clothRectArr.push(rectRight);
                  }else if(side.pStart.x == breakingRect.pLeftBottom.x){
                      //根据破点左侧边切割，
                      cutRect = rectRight;
                      cutResult.clothRectArr.push(rectLeft);
                  }else{
                      //根据破点右侧边切割，
                      cutRect = rectLeft;
                      cutResult.clothRectArr.push(rectRight);
                  }
               }else{
                   console.log('error in cutBybreaking');
               }
           }
           cutResultArr.push(cutResult);
       }
       return cutResultArr;
    },
    //收集切割结果
    gatherCutResults: function () {
        var finalCutResults = new Array();
        if(this.cutResultArr === undefined || this.cutResultArr === null || this.cutResultArr.length <= 0){
            finalCutResults.push(new CutResult(null,new Array(this)));
            return finalCutResults;
        }
        //如果cutResultArr为空，返回自己
        //如果cutResultArr不为空,遍历每一项CutResult，            
        for(var idx = 0; idx < this.cutResultArr.length; idx++){
            var cutResult = this.cutResultArr[idx];
            var finalCutResultArr = new Array(); //记录当前cutResult切割可能情况下的结果
            finalCutResultArr.push(new CutResult(cutResult.cutLineArr)); //先放入包含了当前切割线的结果
            //对CutResult中的clothRectArr里的每个ClothRect调用getFinalCutResults方法
            for(var tmp = 0; tmp < cutResult.clothRectArr.length; tmp++){
                var childClothRect = cutResult.clothRectArr[tmp];  
                var childResults = childClothRect.gatherCutResults();
               
                // if(childResults == null){
                //      //如果返回null,将childClothRect添加到cutResult的clothRectArr中
                //     finalCutResultArr.map(function (resultItem) {
                //         resultItem.clothRectArr.push(childClothRect);
                //     });
                // }else{
                    //如果返回不为空，finalCutResultArr中的每个cutResult与childResults中的cutResult分别合并
                    var combineCutResultArr = function(CutResultArr1,CutResultArr2){
                        var ReturnArr = new Array();
                        for(var idx1 = 0; idx1 < CutResultArr1.length; idx1++){
                            for (var idx2 = 0; idx2 < CutResultArr2.length; idx2++) {
                                var cutLineArr = CutResultArr1[idx1].cutLineArr;
                                if(CutResultArr2[idx2].cutLineArr != null){
                                    var cutLineArr = CutResultArr1[idx1].cutLineArr.concat(CutResultArr2[idx2].cutLineArr);
                                }
                                var clothRectArr = CutResultArr1[idx1].clothRectArr.concat(CutResultArr2[idx2].clothRectArr);
                                ReturnArr.push(new CutResult(cutLineArr,clothRectArr));
                            }
                        }
                        /*console.log('CutResultArr1 length:' + String(CutResultArr1.length) 
                            + '  CutResultArr2 lenght:' + CutResultArr2.length + ' ReturnArr length:' + String(ReturnArr.length));*/
                        return ReturnArr;
                    };
                    finalCutResultArr = combineCutResultArr(finalCutResultArr,childResults);
                //}
            }
            //把当前情况下的所有结果合并到总的结果中
            finalCutResults = finalCutResults.concat(finalCutResultArr);
        }
        return finalCutResults;
    }
});

//已经剪切过的布块
var CutClothRectList = function(){
    this.clothRectArr = new Array();
    //判定是否已经剪切过
    this.isCutClothRect = function (clothRect){
         if(this.clothRectArr != undefined && this.clothRectArr != null && this.clothRectArr.length > 0){
             for(var idx = 0; idx < this.clothRectArr.length; idx++){
                 var cutCR = this.clothRectArr[idx];
                 if(clothRect.isSame(cutCR)){
                     return {isCut:true,clothRect:cutCR};
                 }
             }
         }        
        return {isCut:false,clothRect:null};
    }
    this.addCutClothRect = function (clothRect) {
        this.clothRectArr.push(clothRect);
    }
}