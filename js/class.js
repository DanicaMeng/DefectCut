var Class = (function() {
  //对象方法
  var _mix = function(r, s) {
    for (var p in s) {
      //(hasOwnProperty：是用来判断一个对象是否有你给出名称的属性或对象。不过需要注意的是，此方法无法检查该对象的原型链中是否具有该属性，该属性必须是对象本身的一个成员)
      if (s.hasOwnProperty(p)) {
        r[p] = s[p];
      }
    }
  }
  //对象方法
  var _extend = function() {

    //开关 用来使生成原型时,不调用真正的构成流程init
    this.initPrototype = true;
    var prototype = new this();//使SubClass的prototype链来自当前调用对象，new this()相当于把自己拷贝一份
    this.initPrototype = false;
    
    //argument 对象包含了函数调用的参数,转换为数组
    var items = Array.prototype.slice.call(arguments,0) || [];
    var item;

    //支持混入多个属性，并且支持{}也支持 Function (Function情况下，item.prototype是存在的，{}情况下，item.prototype不存在)
    while (item = items.shift()) {
      _mix(prototype, item.prototype || item);
    }

    // 这边是返回的类，其实就是我们返回的子类（也就是类的构造函数）
    function SubClass() {
      if (!SubClass.initPrototype && this.init)//(需要在 new 时调用 init 函数，但在调用 extend扩展子类时的 new this()，不执行 init 函数)
        //(this：指代通过这个构造函数生成的新对象，apply：用第一个参数 this指代的对象替代 this.init 函数中的 this 对象，将arguments传递给this.init 函数)
        this.init.apply(this, arguments);//调用init真正的构造函数
    }

    // 赋值原型链，完成继承（可以理解为把方法和属性全部克隆了一遍，,对于prototype的方法或者属性,我们可以 动态地 增加, 而由其创建的 对象自动会 继承 相关的方法和属性.）
    SubClass.prototype = prototype;

    // 改变constructor引用（constructor 是一个函数对象，用于指向创建其的函数对象）
    SubClass.prototype.constructor = SubClass;

    // 为子类也添加extend方法(使子类能够继续被扩展，)
    SubClass.extend = _extend;

    return SubClass;//_extend函数返回的是子类的构造函数（也是函数对象）
  }
  //超级父类(构造函数)
  var Class = function() {};
  //为超级父类添加extend方法
  Class.extend = _extend;
  
  return Class;
})();