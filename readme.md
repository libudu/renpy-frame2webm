## 解决的问题

Renpy中如何实现人物的动态立绘？

在Renpy的live2d模块正式支持之前，想要在Renpy中加载带动态的人物立绘基本只能采用帧动画的方式。

但是由于帧动画性能较差，根据apoto在罗曼和灵龙岛项目中的实践，哪怕对图片采用高压缩（比如使用我的上一个项目ultra-tinypng进行压缩），也必须以720p画质、低帧率再加上一定抽帧才能流畅运行。尽管如此，同屏出现多个人物时还是可能出现无法预料的卡顿。

那么能不能不使用帧动画，而是处理成一个相对于庞大的帧动画来说很小、只需要加载一次的视频文件，比如webm，在游戏中加载成动态的人物立绘呢？

答案是可以的，并且效果很好。尽管探索过程非常曲折麻烦，但是使用本项目可以很低成本快速地实现该效果。

感谢伊万德酱对于本项目的支持，最初idea的提出以及关键的ffmpeg命令都是他贡献的。

## 如何在Renpy中将webm加载为人物立绘

我们以人物napoleon的happy表情为例

假设人物napoleon的happy表情的webm文件在renpy项目目录中的路径如下：images/characters/napoleon/happy.webm

那么在Renpy代码中，我们应该这样将webm文件加载为Movie对象，再加载为可视组件，再注册为renpy的人物表情：

```
init python:
    movie = Movie(play = "characters/napoleon/happy.webm")
    renpy.image("linpicio happy", Transform(movie, zoom = 1.5))
```

![image](/readme_assets/1.gif)

可以看到，webm视频在人物边缘变动时会出现很难看的白点锯齿，这几乎是不可接受的。

为了解决这个问题，参考了renpy的文档后，发现是需要增加一个mask，作为可视组件的alpha通道。这个mask视频是这样的：

![image](/readme_assets/2.gif)

添加了mask之后，效果已经很接近于可用了：

```
init python:
    movie = Movie(play = "characters/napoleon/happy.webm", mask = "characters/napoleon/happy_mask.webm")
```

![image](/readme_assets/3.gif)

然而，当出现较多人物出现、场景前后过渡切换的时候，“得益于”Renpy强大的资源加载能力，有时人物会出现非常奇怪的轻微拖影。尽管效果较为轻微，但是仔细留意发现后就会感觉非常出戏和奇怪。

查阅了大量资料和源码后，发现是Renpy对于Movie和mask的加载时间差导致出现了帧不同步问题。要解决这个需要使用side_mask特性：

> side_mask
> 
> 若为True，Ren’Py会将该Movie对象设置为水平并排(side-by-side)mask模式。 Movie对象将被对等分割为两部分。左半为颜色信息，右半为alpha通道信息。对应的可视组件宽度也为该视频文件的一半。
> 
> 尽可能使用 mask 而不是 side_mask ，除非有帧同步问题。

简单来说，side_mask要求将webm文件和其mask文件合成一个文件，一个在左半边一个在右半边。因为就是一个视频，自然就不会出现帧不同步了。

合成后的视频看起来是这样的：

![image](/readme_assets/4.png)

再次运行游戏后，发现效果再次非常接近完美了。

然而，随着测试的不断进行，发现在极个别人物的个别表情下，可能会出现闪动才出现的问题。

经过思考和查阅资料后意识到，这是由于尽管同一个表情做成的webm文件比全部帧动画加起来的尺寸要小非常多，但是比帧动画中的一帧图片还是要大不少的。由于视频需要全部加载后才能播放，可能由此导致了在视频加载完的数个毫秒的时间出现闪动。

对此，需要通过Movie的start_image属性，提供一张首屏图片，视频没有加载完成的时候就会使用这张图片作为显示，避免闪动问题。

最终代码如下：

```
init python:
    movie = Movie(play = "characters/napoleon/happy.webm", side_mask = True, start_image = "characters/napoleon/happy.png")
    renpy.image("linpicio happy", Transform(movie, zoom = 1.5))
```

## 如何将帧动画转换为webm

接下来的问题自然就变成了：如何根据帧动画生成webm？如何生成webm的遮罩？又怎么把两个视频拼在一起？

可以通过ffmpeg实现。

这正是本项目所做的工作，具体细节不在此赘述（因为其实我也不太懂ffmpeg的基本操作）。

## 那么我需要做什么？

1. 下载工具包
2. 将图片资源（jpg或png格式）按照 人物名/表情名/文件 的三级目录结构放置在img_source目录下，表情的文件名需要是
3. 双击运行exe文件
4. 观察提示，等待程序运行完成
5. 检查webm_result目录下的产物，将其复制到你的renpy项目中的characters目录下


## live2d还是webm？

首先如果你的项目中的帧动画并不是用live2d实现的（比如手绘的像素动画、骨骼动画等），那肯定只能考虑帧动画转webm了。

其次如果发布的平台包含

考虑到live2d并非单纯的，将来可能会有更灵活的支持（比如在不同动画之间平滑过渡而不是单纯的播片切换），甚至可以做到分部位控制等功能，