---
layout: doc
---
# Git笔记


### 自报家门
> 因为Git是分布式版本控制系统，所以，每个机器都必须自报家门：你的名字和Email地址。


+ 名字 ```$ git config --global user.name "Your Name"```

+ 邮箱 ```$ git config --global user.email "email@example.com"```

> 注意 ```git config``` 命令的 ```--global``` 参数，用了这个参数，表示你这台机器上所有的Git仓库都会使用这个配置，当然也可以对某个仓库指定不同的用户名和Email地址。


### 工作区和暂存区
+ 工作区（Working Directory）
     就是你在电脑里能看到的目录，比如创建的文件夹就是一个工作区


+ 暂存区（stage或者叫index）
     git add命令实际上就是把要提交的所有修改放到暂存区，然后，执行git commit就可以一次性把暂存区的所有修改提交到分支。

### 创建版本库
> 找到文件夹，然后 ```$ git init```

### 关联 github 远程仓库
1. 创建SSH Key
      先看看用户目录有没有.ssh目录，再看看这个目录下有没有id_rsa和id_rsa.pub这两个文件，如果有，跳过，如果没有，创建SSH Key：
      ```$ ssh-keygen -t rsa -C "youremail@example.com"```

2. 给github添加SSH Key
      登陆GitHub，```Settings``` -> ```SSH and GPG keys``` -> ```Add SSH Key``` ，填上任意Title，在Key文本框里粘贴id_rsa.pub文件的内容

3. 在github创建仓库
      登陆GitHub，点击 ```New repositor``` ，在 Repository name 写入仓库名，点击 Create repository 按钮创建

4. 在本地关联远程库
      ```$ git remote add origin git@github.com:<github帐号>/<远程仓库名>.git```

5. 把本地库的所有内容推送到远程库上
      ```$ git push -u origin master```
      由于远程库是空的，我们第一次推送master分支时，加上了-u参数，Git不但会把本地的master分支内容推送的远程新的master分支，还会把本地的master分支和远程的master分支关联起来，在以后的推送或者拉取时就可以简化命令。

6. SSH警告
      当你第一次使用Git的clone或者push命令连接GitHub时，会得到一个警告：

        The authenticity of host 'github.com (xx.xx.xx.xx)' can't be established.
        RSA key fingerprint is xx.xx.xx.xx.xx.
        Are you sure you want to continue connecting (yes/no)?
      这是因为Git使用SSH连接，而SSH连接在第一次验证GitHub服务器的Key时，需要你确认GitHub的Key的指纹信息是否真的来自GitHub的服务器，输入yes回车即可。
      Git会输出一个警告，告诉你已经把GitHub的Key添加到本机的一个信任列表里了：
      ```Warning: Permanently added 'github.com' (RSA) to the list of known hosts.```
      这个警告只会出现一次，后面的操作就不会有任何警告了。

### 从远程库克隆
```$ git clone git@github.com:<github帐号>/<远程仓库名>.git```

> 如果有多个人协作开发，那么每个人各自从远程克隆一份就可以了。


### 常用命令
+ 添加到暂存区 ```$ git add <file>```
     - 添加所有文件 ```$ git add -A```

+ 提交到仓库 ```$ git commit -m "本次提交的说明" ```
     - 提交所有文件到仓库 ```$ git commit -am "本次提交的说明" ```

+ 查看仓库当前的状态 ```$ git status ```

+ 查看文件的修改内容 ```$ git diff <file> ```

+ 显示从近到远的提交日志 ```$ git log ```
     - 精简提交日志 ```$ git log --pretty=oneline```

+ 回退到上一个版本 ```$ git reset --hard HEAD^ ```
     - 当前版本 ```HEAD```
     - 上一个版本就是 ```HEAD^```
     - 上上一个版本就是 ```HEAD^^```
     - 上100个版本 ```HEAD~100```

+ 回退到指定版本 ```$ git reset --hard c247146 ``` （c247146 是 commit id）

+ 查看操作日志 ```$ git reflog ```

+ 查看工作区和版本库里面最新版本的区别 ```git diff HEAD -- <file> ```

+ 丢弃工作区的修改 ```$ git checkout -- <file>``` 
     - ```git checkout``` 是用版本库里的版本替换工作区的版本

+ 撤销暂存区的修改 ```$ git reset HEAD <file>```

+ 关于撤销修改
     - 场景1：当你改乱了工作区某个文件的内容，想直接丢弃工作区的修改时，用命令 ```git checkout -- <file>``` 。
     - 场景2：当你不但改乱了工作区某个文件的内容，还添加到了暂存区时，想丢弃修改，分两步，第一步用命令 ```git reset HEAD <file>```，就回到了场景1，第二步按场景1操作。
     - 场景3：已经提交了不合适的修改到版本库时，想要撤销本次提交，参考版本回退，不过前提是没有推送到远程库。

+ 从版本库中删除 ```$ git rm <file>```

-------------------

+ 往远程库推送最新修改 ```$ git push origin master```

-------------------

+ 查看所有分支：```$ git branch```
      带 * 表示当前分支

+ 创建分支：```$ git branch <分支名>```

+ 切换分支：```$ git checkout <分支名>```

+ 创建+切换分支：```$ git checkout -b <分支名>```

+ 合并某分支到当前分支：```$ git merge <分支名>```

+ 删除分支：```$ git branch -d <分支名>```
     - 丢弃一个没有被合并过的分支（强制删除）```$ git branch -D <分支名>```
     - 删除远程分支 ```git push origin :<分支名>```

+ 查看分支合并图 ```$ git log --graph```
     - 精简合并图 ```$ git log --graph --pretty=oneline```
     - 精简 commit_id ```$ git log --graph --pretty=oneline --abbrev-commit```

+ 合并的时候添加合并信息 ```$ git merge --no-ff -m "合并信息" <分支名>```
     - 通常，合并分支时，Git会用Fast forward模式，在这种模式下，删除分支后，会丢掉分支信息。
     - 强制禁用Fast forward模式，Git就会在merge时生成一个新的commit，这样，从分支历史上就可以看出分支信息
     - ```--no-ff``` 参数，表示禁用```Fast forward```

-------------

+ 存储当前工作现场 ```$ git stash```

+ 查看所有存储的工作现场 ```$ git stash list```

+ 删除存储的工作现场 ```$ git stash drop```

+ 恢复存储的工作现场
     - ```$ git stash apply``` 恢复后，stash内容并不删除，你需要用 ```git stash drop``` 来删除
     - ```$ git stash pop``` 恢复的同时把stash内容也删了
     - 恢复指定的stash：```$ git stash apply stash@{0}```
     - 当手头工作没有完成时，先把工作现场git stash一下，然后去修复bug，修复后，再git stash pop，回到工作现场。

----------------------

+ 查看远程库的信息 ```$ git remote```
     - 显示更详细的信息 ```$ git remote -v```
     - 显示可以抓取(fetch)和推送(push)的origin的地址。如果没有推送权限，就看不到push的地址。

+ 推送分支 ```$ git push origin <分支名>```
     - master分支是主分支，因此要时刻与远程同步；
     - dev分支是开发分支，团队所有成员都需要在上面工作，所以也需要与远程同步；
     - bug分支只用于在本地修复bug，没必要推到远程
     - feature分支是否推到远程，取决于你是否和你的小伙伴合作在上面开发。

+ 在本地创建和远程分支对应的分支 ```$ git checkout -b <分支名> origin/<分支名>```
     - 本地和远程分支的名称最好一致；

+ 多人协作的工作模式
     - 首先，可以试图用 ```$ git push origin <分支名>``` 推送自己的修改；
     - 如果推送失败，则因为远程分支比你的本地更新，需要先用 ```$ git pull``` 试图合并；
     - 如果合并有冲突，则解决冲突，并在本地提交；
     - 没有冲突或者解决掉冲突后，再用 ```$ git push origin <分支名>``` 推送就能成功！

     如果 ```$ git pull``` 提示 **“no tracking information”**，则说明本地分支和远程分支的链接关系没有创建，用命令 ```$ git branch --set-upstream <分支名> origin/<分支名>``` == ```$ git branch --set-upstream-to origin/<分支名> <分支名>```。

-------------------

+ 创建标签 ```$ git tag <name>```

+ 给历史提交commit 创建标签 ```$ git tag <name> <commit_id>```

+ 创建带有说明的标签 ```$ git tag -a <name> -m "标签说明" <commit_id>```
     - 用 -a 指定标签名，-m 指定说明文字

+ 查看所有标签 ```$ git tag```
     - 标签不是按时间顺序列出，而是按字母排序的

+ 查看标签信息 ```$ git show <tagname>```

+ 推送某个标签到远程 ```$ git push origin <tagname>```

+ 一次性推送全部尚未推送的本地标签到远程的 ```$ git push origin --tags```

+ 删除一个本地标签 ```$ git tag -d <tagname>```

+ 删除一个远程标签 ```$ git push origin :refs/tags/<tagname>```

---------------------

+ 给 git 命令配置别名 ```$ git config --global alias.st status```
     - 以后 st 就表示 status

----------------------
### 保持github上fork的项目与原项目同步
> 转自[云栖社区](https://yq.aliyun.com/articles/39474)
- 首先先通过 github 的 web 页面 fork 目标的项目
前提是自己已经设置好了git,并且配置了相应的权限
 - 然后使用git clone命令在本地克隆自己 fork 的项目：
    ```git clone https://github.com/YOUR-USERNAME/project—name```
 
- 然后需要复制被自己fork的项目的git地址
- 切换到自己之前克隆的项目的路径下，使用：
    ```git remote -v```
    就可以看到当前项目的远程仓库配置

- 然后使用下面的命令：
    ```git remote add upstream``` 原始项目仓库的git地址

- 然后如果你继续使git remove -v命令查看的话，就会发现这个时候已经和原始的被fork的项目产生了关联。

- 如果想保持项目同步的话，一般使用下面的命令就好了：
      ```git fetch upstream```
      ```git merge upstream/master```
