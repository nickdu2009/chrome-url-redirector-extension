# URL前缀重定向器 Chrome 插件

一个强大的Chrome插件，能够基于URL前缀自动重定向到指定的目标URL，同时支持保留原始查询参数和添加额外的查询参数。

## 功能特性

1. **URL前缀匹配** - 识别以特定前缀开头的URL并进行重定向（不包含query参数和hash）
2. **查询参数匹配** - 支持基于查询参数的精确匹配条件（完全匹配、包含、开头匹配等）
3. **保留查询参数** - 可选择保留原始URL中的所有查询参数
4. **路径保留** - 可选择保留原始URL的路径部分
5. **额外参数添加** - 支持为重定向的URL添加自定义查询参数
6. **规则管理** - 支持添加、编辑、删除和启用/禁用重定向规则
7. **现代化界面** - 美观易用的弹窗界面

## 安装方法

1. 打开Chrome浏览器，进入 `chrome://extensions/`
2. 开启右上角的"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择 `chrome-url-redirector` 文件夹
5. 插件安装完成，会在浏览器工具栏显示图标

## 使用方法

### 添加重定向规则

1. 点击浏览器工具栏中的插件图标
2. 点击"添加规则"按钮
3. 填写以下信息：
   - **规则名称**：便于识别的规则描述
   - **源URL前缀**：要匹配的URL前缀（例如：`https://github.com`）
   - **目标URL**：重定向的目标地址（例如：`https://gitee.com`）
   - **保留原始查询参数**：是否保留原URL的查询参数
   - **保留原始路径**：是否保留原URL的路径
   - **查询参数匹配条件**：指定必须满足的查询参数条件
   - **额外查询参数**：为目标URL添加的自定义参数
   - **启用此规则**：是否立即启用该规则

### 查询参数匹配类型

- **完全匹配**：参数值必须完全相等
- **包含**：参数值包含指定文本
- **开头匹配**：参数值以指定文本开头
- **结尾匹配**：参数值以指定文本结尾
- **存在即可**：只要参数存在，无论值是什么
- **不存在**：参数不能存在

### 规则示例

#### 示例1：GitHub到Gitee重定向
- **规则名称**：GitHub重定向到Gitee
- **源URL前缀**：`https://github.com`
- **目标URL**：`https://gitee.com`
- **保留原始查询参数**：✓
- **保留原始路径**：✓

访问 `https://github.com/user/repo?tab=readme` 
将重定向到 `https://gitee.com/user/repo?tab=readme`

**注意**：前缀匹配只针对 `https://github.com/user/repo` 部分，query参数 `?tab=readme` 不参与匹配

#### 示例2：添加跟踪参数
- **规则名称**：内部链接跟踪
- **源URL前缀**：`https://example.com`
- **目标URL**：`https://example.com`
- **保留原始查询参数**：✓
- **额外查询参数**：
  - `source` = `chrome_extension`
  - `utm_medium` = `redirect`

访问 `https://example.com/page?id=123`
将重定向到 `https://example.com/page?id=123&source=chrome_extension&utm_medium=redirect`

#### 示例3：条件重定向（基于query参数）
- **规则名称**：特殊页面重定向
- **源URL前缀**：`https://example.com`
- **目标URL**：`https://newsite.com`
- **查询参数匹配条件**：
  - `type` 完全匹配 `special`
  - `version` 开头匹配 `v2`
- **保留原始查询参数**：✓

访问 `https://example.com/page?type=special&version=v2.1&other=value`
将重定向到 `https://newsite.com/page?type=special&version=v2.1&other=value`

但访问 `https://example.com/page?type=normal&version=v2.1` 不会触发重定向（type不匹配）

### 管理规则

- **编辑规则**：点击规则卡片中的"编辑"按钮
- **启用/禁用规则**：点击"启用"或"禁用"按钮
- **删除规则**：点击"删除"按钮（需要确认）

## 技术实现

### 核心功能
- 使用 `chrome.webNavigation` API 监听导航事件
- 使用 `chrome.tabs` API 执行页面重定向
- 使用 `chrome.storage.sync` API 同步保存规则数据

### 文件结构
```
chrome-url-redirector/
├── manifest.json          # 插件配置文件
├── background.js           # 后台服务脚本
├── popup.html             # 弹窗界面
├── popup.css              # 弹窗样式
├── popup.js               # 弹窗逻辑
├── icons/                 # 插件图标
│   └── icon.svg
└── README.md              # 说明文档
```

## 注意事项

1. **权限说明**：插件需要访问所有网站的权限以监听导航事件
2. **规则匹配**：规则按添加顺序匹配，只会应用第一个匹配的规则
3. **前缀匹配范围**：前缀匹配只包括协议、域名、端口和路径，不包括query参数和hash
4. **URL格式**：确保输入的URL格式正确，包含协议部分（http/https）
5. **性能影响**：插件对浏览器性能影响极小，只在导航时进行检查

## 故障排除

如果遇到问题：

1. **插件未生效**：检查规则是否已启用，URL前缀是否正确
2. **重定向失败**：检查目标URL是否有效，网络连接是否正常
3. **参数丢失**：确认"保留原始查询参数"选项已勾选
4. **控制台错误**：打开开发者工具查看错误信息

## 更新日志

### v1.0.0
- 初始版本发布
- 支持URL前缀匹配重定向
- 支持查询参数保留和添加
- 现代化用户界面

## 许可证

MIT License

## 贡献

欢迎提交Issues和Pull Requests来改进这个项目。 