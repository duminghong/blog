# margin负值详解


![MARGIN](../assets/img/4853363-ee8a754f54875841.png)

## 先看看 margin 

> **margin：** CSS外补白，外边距，是从自身边框到另一个容器边框之间的距离。

##### 四个方向：
- 上边距：**margin-top**
- 下边距：**margin-bottom**
- 左边距：**margin-left**
- 右边距：**margin-right**

##### 简写：
- **margin:10px 20px 30px 40px;**
    + 上边距为10px
    + 右边距为20px
    + 下边距为30px
    + 左边距为40px

- **margin:10px 20px 30px;**
    + 上边距为10px
    + 右左边距都为20px
    + 下边距为30px

- **margin:10px 20px;**
    + 上下边距都为10px
    + 右左边距都为20px

- **margin:10px;**
    + 上右下左边距都为10px



## margin负边距
> margin为 **正值** 时，元素在 **文档中所占位置** 是从border之外向四周 **扩展** 的，而为 **负值** 时，则是向内 **收缩** 的(图2)。

1. 正值的时候，元素所占的位置向周围扩散了20px

    ![图1](../assets/img/4853363-64d86bddf94d4790.png)

2. 这是负值，可以看到，第二个元素实际 **所占的位置** 已经少了20px，反映在页面就是，元素2向左偏移了20px

    ![图2](../assets/img/4853363-0160320a9ee70636.png)

3. 当偏移大于自身宽度的时候，自身将不再 **占有位置** ，后续的元素会无视他（就当没有你这个兄弟！）（图3左负值，图4右负值）

    ![图3](../assets/img/4853363-2536517dd8280403.png)
    ![图4](../assets/img/4853363-ef74e3cc05c9944d.png)

4. 但是，当元素没有固定宽度的时候（或者 **width:auto;**），负值会增加自身宽度！看图，两边露出来了！这是要逆天啊，有木有！
  
    ![图5](../assets/img/4853363-13fd0d7e8cefdfd9.png)

5. 仔细看就会发现，margin只是对元素在 **文档中所占的位置** 产生影响，**正值扩大**，**负值缩小**，记住这点，咱们就可以做很多有意思的东西。



## 实例

- 经典的利用绝对定位来垂直水平居中，如图6：
     给元素绝对定位，left、top分别为50%；然后margin-top为 负的高度的一半、margin-left为 负的宽度的一半。

    ![图6](../assets/img/4853363-bc162a435c5bd782.png)

    ```
      <style type="text/css">
        .box{
            width:600px;
            height:600px;
            margin:20px;
            border:1px solid #000;
            position:relative;
        }
        .con{
            width:200px;
            height:200px;
            background-color:red;
            position:absolute;
            left:50%;
            top:50%;
            margin:-100px 0 0 -100px;
        }
      </style>
      <body>
          <div class="box">
              <div class="con"></div>
          </div>
      </body>
    ```
***********************************

- 列表布局有边框，如图7：
       
    ![图7](../assets/img/4853363-2085fb8d729a10d0.png)
 
     这样可以直接上左都为-1px，然后相对定位，z-index:0 ， 父级padding上左为1px。
       
     也可以右下都为-1px，相对定位，z-index:0，父级只需padding-bottom为1px
    ```
      <style type="text/css">
        .box{
            width:805px;
            margin:20px;
            position:relative;
        }
        .box ul{
            padding:1px 0 0 1px; /*父级加padding是为了补足子集的偏移*/
            /*或 padding-bottom:1px;*/
            overflow:hidden;
        }
        .box ul li{
            float:left;
            width:200px;
            height:240px;
            text-align:center;
            line-height:240px;
            border:1px solid #000;
            margin:-1px 0 0 -1px; /*或 margin:0 -1px -1px 0;*/
            background-color:#d7d7d7;
            position:relative;
            z-index:0; /*加定位跟z-index是为了有hover状态的时候完整的显示*/
        }
        .box ul li:hover{
            border-color:red;
            z-index:1;
        }
      </style>
      <body>
          <div class="box">
              <ul>
                  <li>1</li>
                  <li>2</li>
                  <li>3</li>
                  <li>4</li>
                  <li>5</li>
                  <li>6</li>
                  <li>7</li>
                  <li>8</li>
                  <li>9</li>
                  <li>10</li>
                  <li>11</li>
                  <li>12</li>
              </ul>
          </div>
      </body>
    ```
**********************************

 - 还是列表，有间距的列表，如图8：
    
  ![图8](../assets/img/4853363-9368ba82b800243e.png)

    这个利用负值介绍中的第四条（当元素没有固定宽度的时候（或者 **width:auto;**），负值会增加自身宽度），会特别简单，看代码

```
        <style type="text/css">
        .box{
            width:800px;
            margin:20px;
            border:1px solid #000;
            overflow:hidden;
        }
        .box ul{
            overflow:hidden;
            margin-right:-20px;
        }
        .box ul li{
            float:left;
            width:185px;
            height:240px;
            text-align:center;
            line-height:240px;
            color:#fff;
            margin:0 20px 20px 0;
            background-color:red;
        }
        </style>
        <body>
          <div class="box">
              <ul>
                  <li>1</li>
                  <li>2</li>
                  <li>3</li>
                  <li>4</li>
                  <li>5</li>
                  <li>6</li>
                  <li>7</li>
                  <li>8</li>
                  <li>9</li>
                  <li>10</li>
                  <li>11</li>
                  <li>12</li>
              </ul>
          </div>
        </body>
```

***********************************

- 右边固定，左边自适应布局，如图9：
     
    ![图9](../assets/img/4853363-bed8e40a453b41bb.png)

     给左边盒子加个父级，宽100%、左浮动，左边黑字margin-right： 右边盒子的宽；右边盒子固定宽、左浮动，margin-left：负的本身宽度。
       
     这样当外层的宽度变换的时候，左边的盒子会跟随变化，具体看代码：
    ```
      <style type="text/css">
        .box{
            width:800px;
            margin:20px;
            border:1px solid #000;
            overflow:hidden;
        }
        .box .left_par{
            float:left;
            width:100%;
        }
        .box .left_par .left{
            margin-right:100px;
            background-color:blue;
            color:#fff;
        }
        .box .right{
            float:left;
            width:100px;
            height:100px;
            line-height:100px;
            text-align:center;
            margin-left:-100px;
            background-color:red;
            color:#fff;
        }
      </style>
      <body>
        <div class="box">
            <div class="left_par">
                <div class="left">内容 ... 内容</div>
            </div>
            <div class="right">头像</div>
        </div>
      </body>
    ```
***********************************

- 还有经典的等高列布局，如图10：

    ![图10](../assets/img/4853363-a5353cbf79fffa48.png)

     还记得前面讲的 **margin只是对元素在 文档中所占的位置 产生影响** 吗？
       
     如果给margin-bottom负值，那么他所占的位置会往上收缩，利用这个特性，我们可以做等高列布局，看代码：
    ```   
      <style type="text/css">
        .box{
            margin: 40px auto;
            overflow: hidden;
            /*把内容以外的溢出隐藏，主要是隐藏padding添加的那一部分背景*/
            width: 610px;
        }
        .list {
            background: #ccc;
            float: left;
            width: 200px;
            margin-right: 5px;
            padding-bottom: 99999px; /*给一个列表不可能达到的高度，主要是为了添加背景*/
            margin-bottom: -99999px; /*把padding给的高度给收缩回去*/
        }
        #content {
            background: #eee;
        }
        #right {
            margin-right: 0;
        }
      </style>
      <body>
        <div class="box">
            <div id="left" class="list">
                <p>左侧内容</p>
                <p>左侧内容</p>
                <p>左侧内容</p>
                <p>左侧内容</p>
                <p>左侧内容</p>
                <p>左侧内容</p>
            </div>
            <div id="content" class="list">
                <p>中间内容</p>
            </div>
            <div id="right" class="list">
                <p>右侧内容</p>
            </div>
        </div>
      </body>
    ```
*************************

> 先这么多，待续...


_有不明白的可以留言☺_