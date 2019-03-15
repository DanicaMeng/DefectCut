
//坐标（已左下为坐标原点）
var Coordinate = function(x,y) {
    this.x = x;
    this.y = y;
    this.isSame = function(coordinate){
        return this.x === coordinate.x && this.y === coordinate.y;
    };
    this.join = function () {
        return String(this.x) + ' ' + String(this.y);
    }
};
//切割线
var CutLine = function(pStart,pEnd) {
    this.pStart = pStart; //切割线的起点
    this.pEnd = pEnd;     //切割线的终点
    this.join = function () {
        return '[' + this.pStart.join() + ' -- ' + this.pEnd.join() + ']';
    }
    this.drow = function (ctx,index){
        ctx.beginPath();
        ctx.strokeStyle = "#FFBE04";
        ctx.moveTo(this.pStart.x,this.pStart.y);
        ctx.lineTo(this.pEnd.x,this.pEnd.y);
        ctx.stroke();
        if(index != undefined){
            ctx.fillText(index,(this.pStart.x + this.pEnd.x)/2 , (this.pStart.y + this.pEnd.y)/2);
        }
    }
}
//切割结果
var CutResult = function(cutLineArr,clothRectArr) {
    if(cutLineArr === undefined){
        this.cutLineArr = new Array(); //切割序列
    }else{
        this.cutLineArr = cutLineArr; //切割序列
    }
    if(clothRectArr === undefined){
        this.clothRectArr = new Array();     //按切割序列切割后得到的布料
    }else{
        this.clothRectArr = clothRectArr;     //按切割序列切割后得到的布料
    }
    this.join = function (){
       var lineStr = '';
       if(this.cutLineArr != null ){
           lineStr=  this.cutLineArr.map(function (item){
                return '<li>' + item.join() + '</li>';
            }).join('');
       }
       var clothStr = this.clothRectArr.map(function(item){
           return '<li>' + item.join()+ '</li>';
       }).join('');
       return "<p>切割线：</p><ol>" + lineStr + '</ol><p>剪切出的可用布料：</p><ol type="a">' + clothStr + '</ol>';
    },
    this.drow = function (ctx){
        this.clothRectArr.map(function (item,index) {
            var strArr = ['a','b','c','d','e','f','g','h','i','j','k','l','m',
                          'n','o','p','q','r','s','t','u','v','w','x','y','z']
            item.drow(ctx,"#EFEFEF",strArr[index]);
        });
        if(this.cutLineArr != null ){
            this.cutLineArr.map(function (item,index){
            item.drow(ctx,index+1);
        });
        }
        
    }
}
//布片
var ClothPieces = function(width, height,numbre) {
    this.width = width;
    this.height = height;
    this.numbre = numbre;
    this.copy = function() { return new ClothPieces(this.width,this.height,this.numbre)};
}

//得到数据arr中元素的全排列
function permutation(arr) { 
    var resultArr = new Array();
     var result = new Array(arr.length); 
     var fac = 1; 
     for (var i = 2; i <= arr.length; i++) 
         fac *= i; 
     for (index = 0; index < fac; index++) { 
         var t = index; 
         for (i = 1; i <= arr.length; i++) { 
             var w = t % i; 
             for (j = i - 1; j > w; j--) 
                 result[j] = result[j - 1]; 
             result[w] = arr[i - 1]; 
             t = Math.floor(t / i); 
         } 
         resultArr.push(result); 
     } 
     return resultArr;
 } 