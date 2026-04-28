// Initialize demo when CanvasTable library is loaded
(function() {
  if (window.CanvasTable) {
    initDemo();
  } else {
    console.error('CanvasTable library not loaded. Make sure canvas-table.umd.cjs is available.');
  }
})();

function initDemo() {
  var CanvasTable = window.CanvasTable.default || window.CanvasTable;

  // Render toast utility
  var renderToast = {
    element: document.getElementById('renderToast'),
    createTimeSpan: document.getElementById('createTime'),
    renderTimeSpan: document.getElementById('renderTime'),
    timeout: null,

    show: function(createTime, renderTime) {
      if (!this.element) return;
      if (this.timeout) clearTimeout(this.timeout);
      this.createTimeSpan.textContent = createTime.toFixed(2) + 'ms';
      this.renderTimeSpan.textContent = renderTime.toFixed(2) + 'ms';
      this.element.classList.add('show');
      this.timeout = setTimeout(function() { renderToast.hide(); }, 3000);
    },

    hide: function() {
      if (this.element) this.element.classList.remove('show');
    }
  };

  // Seeded random generator
  var DATA_SEED = 12345;
  function createSeededRandom(seed) {
    var s = seed;
    return function() {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };
  }

  // Generate data
  function generateData(count, seed) {
    seed = seed || DATA_SEED;
    var random = createSeededRandom(seed);
    var firstNames = ['张', '李', '王', '刘', '陈', '杨', '赵', '黄', '周', '吴'];
    var lastNames = ['伟', '芳', '娜', '敏', '静', '丽', '强', '磊', '军', '洋'];
    var departments = ['技术部', '市场部', '销售部', '人事部', '财务部'];
    var statuses = ['active', 'inactive', 'pending'];
    var skillOptions = ['JavaScript', 'TypeScript', 'React', 'Vue', 'Angular', 'Node.js', 'Python', 'Java', 'Go', 'Rust', 'Docker', 'Kubernetes'];
    var levelOptions = ['junior', 'middle', 'senior', 'expert'];

    var rows = [];
    for (var i = 0; i < count; i++) {
      var selected = random() > 0.67;
      var radioValue = ['high', 'medium', 'low'][Math.floor(random() * 3)];
      var level = levelOptions[Math.floor(random() * levelOptions.length)];
      var enabled = random() > 0.5;

      var roleOptions = ['admin', 'editor', 'viewer', 'developer'];
      var numRoles = Math.floor(random() * 3) + 1;
      var roles = [];
      for (var r = 0; r < numRoles; r++) {
        var role = roleOptions[Math.floor(random() * roleOptions.length)];
        if (roles.indexOf(role) === -1) roles.push(role);
      }

      var numSkills = Math.floor(random() * 10) + 1;
      var skills = [];
      for (var j = 0; j < numSkills; j++) {
        var skill = skillOptions[Math.floor(random() * skillOptions.length)];
        if (skills.indexOf(skill) === -1) skills.push(skill);
      }

      var name = firstNames[Math.floor(random() * firstNames.length)] + lastNames[Math.floor(random() * lastNames.length)];
      var email = name.toLowerCase() + '@example.com';
      var website = 'https://example.com/users/' + (i + 1);

      rows.push({
        id: 'row-' + i,
        data: {
          id: i + 1,
          name: name,
          email: email,
          website: website,
          secretCode: 'CODE-' + Math.floor(random() * 10000).toString().padStart(4, '0'),
          age: Math.floor(random() * 40) + 20,
          department: departments[Math.floor(random() * departments.length)],
          salary: Math.floor(random() * 50000) + 10000,
          bonus: Math.floor(random() * 10000),
          joinDate: new Date(2020 + Math.floor(random() * 4), Math.floor(random() * 12), Math.floor(random() * 28) + 1).toISOString().split('T')[0],
          status: statuses[Math.floor(random() * statuses.length)],
          score: Math.floor(random() * 100),
          priority: ['high', 'medium', 'low'][Math.floor(random() * 3)],
          selected: selected,
          radioValue: radioValue,
          level: level,
          roles: roles,
          skills: skills,
          enabled: enabled,
          rowIndex: i,
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + (i + 1),
          photos: Array.from({ length: Math.floor(random() * 5) + 1 }).map(function(_, idx) { return 'https://picsum.photos/seed/' + i + '-' + idx + '/100/100'; }),
          progress: Math.floor(random() * 100),
          taskProgress: Math.floor(random() * 100),
          completionRate: Math.floor(random() * 100),
          progressOverflow: Math.floor(random() * 100),
          dashboard: Math.floor(random() * 100),
          volume: Math.floor(random() * 100),
          rating: Math.floor(random() * 10) / 2,
          color: ['#ff4d4f','#ff7a45','#ffa940','#ffc53d','#bae637','#73d13d','#36cfc9','#40a9ff','#597ef7','#9254de','#f759ab','#ff85c0','#a0d911','#13c2c2','#1890ff','#722ed1','#eb2f96','#faad14','#52c41a','#2f54eb'][Math.floor(random() * 20)],
          remark: '备注-' + (i + 1) + '：这是一段较长的备注信息，用于测试多行输入功能。'
        }
      });
    }
    return rows;
  }

  // Avatar colors
  var avatarColors = ['#1890ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1', '#13c2c2', '#eb2f96', '#fa8c16', '#a0d911', '#2f54eb'];

  // Custom avatar name renderer
  function renderAvatarName(name, context) {
    var ctx = context.ctx;
    var x = context.x;
    var y = context.y;
    var width = context.width;
    var height = context.height;
    var padding = context.padding;
    var theme = context.theme;

    var avatarSize = 20;
    var avatarX = x + padding;
    var avatarY = y + (height - avatarSize) / 2;
    var colorIndex = name.charCodeAt(0) % avatarColors.length;
    var avatarColor = avatarColors[colorIndex];

    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = avatarColor;
    ctx.fill();

    var firstChar = name.charAt(0);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold ' + (avatarSize * 0.5) + 'px ' + theme.font.family;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(firstChar, avatarX + avatarSize / 2, avatarY + avatarSize / 2);

    var textX = avatarX + avatarSize + 8;
    var textMaxWidth = width - avatarSize - padding * 2 - 8;
    ctx.fillStyle = theme.colors.cellText;
    ctx.font = theme.font.size + 'px ' + theme.font.family;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    var displayName = name;
    if (ctx.measureText(name).width > textMaxWidth) {
      while (ctx.measureText(displayName + '...').width > textMaxWidth && displayName.length > 0) {
        displayName = displayName.slice(0, -1);
      }
      displayName += '...';
    }
    ctx.fillText(displayName, textX, y + height / 2);
  }

  // Row disabled check
  function isRowDisabled(row) {
    return row.data.id === 1 || row.data.id === 2;
  }

  // Skill tag colors
  var skillTagColors = {
    'JavaScript': { bgColor: '#f7df1e', color: '#000' },
    'TypeScript': { bgColor: '#3178c6', color: '#fff' },
    'React': { bgColor: '#61dafb', color: '#000' },
    'Vue': { bgColor: '#42b883', color: '#fff' },
    'Angular': { bgColor: '#dd0031', color: '#fff' },
    'Node.js': { bgColor: '#68a063', color: '#fff' },
    'Python': { bgColor: '#3776ab', color: '#ffd43b' },
    'Java': { bgColor: '#007396', color: '#fff' },
    'Go': { bgColor: '#00add8', color: '#fff' },
    'Rust': { bgColor: '#dea584', color: '#000' },
    'Docker': { bgColor: '#2496ed', color: '#fff' },
    'Kubernetes': { bgColor: '#326ce5', color: '#fff' }
  };

  // Column definitions
  var columns = [
    { key: 'selected', title: '选择', width: 60, type: 'checkbox', align: 'center', fixed: 'left', sortable: false, filterable: true, disabled: isRowDisabled, render: function(value, row) { return { type: 'checkbox', checkbox: { checked: row.data.selected } }; } },
    { key: 'id', title: 'ID', width: 60, type: 'number', sortable: true, filterable: true, fixed: 'left', disabled: isRowDisabled },
    { key: 'name', title: '姓名', width: 140, sortable: true, filterable: true, editable: true, fixed: 'left', disabled: isRowDisabled, render: function(value) { return { type: 'custom', customRender: function(ctx) { renderAvatarName(String(value), ctx); } }; } },
    { key: 'secretCode', title: '暗号', width: 100, sortable: true, editable: true, hidden: true },
    { key: 'avatar', title: '头像', width: 80, align: 'center', fixed: 'left', editable: true, disabled: isRowDisabled, render: function(value, row) { return { type: 'image', image: { src: row.data.avatar, width: 24, height: 24, scaleWithRowHeight: false, circle: true, clickable: true, hoverable: true } }; } },
    { key: 'photos', title: '相册', width: 180, align: 'center', editable: true, disabled: isRowDisabled, render: function(value, row) { return { type: 'image', image: { images: row.data.photos, width: 32, height: 32, scaleWithRowHeight: false, borderRadius: 4, gap: 4, maxCount: 9, clickable: true, hoverable: true } }; } },
    { key: 'basicInfo', title: '基本信息', children: [
      { key: 'age', title: '年龄', width: 60, type: 'number', sortable: true, filterable: true, align: 'center', disabled: isRowDisabled },
      { key: 'department', title: '部门', width: 100, sortable: true, filterable: true, editable: true, disabled: isRowDisabled }
    ]},
    { key: 'joinDate', title: '入职日期', width: 120, type: 'date', sortable: true, filterable: true, disabled: isRowDisabled, render: function(value) { return { type: 'date', date: { value: value, format: 'YYYY-MM-DD' } }; } },
    { key: 'email', title: '邮箱', width: 180, type: 'link', filterable: true, disabled: isRowDisabled, render: function(value) { return { type: 'link', link: { text: value, link: 'mailto:' + value } }; } },
    { key: 'website', title: '个人主页', width: 150, type: 'link', filterable: true, disabled: isRowDisabled, render: function(value) { return { type: 'link', link: { text: value, link: value } }; } },
    { key: 'income', title: '收入信息', children: [
      { key: 'salary', title: '基本薪资', width: 100, type: 'number', sortable: true, filterable: true, disabled: isRowDisabled, formatter: function(value) { return '¥' + value.toLocaleString(); } },
      { key: 'bonus', title: '奖金', width: 80, type: 'number', sortable: true, filterable: true, disabled: isRowDisabled, formatter: function(value) { return '¥' + value.toLocaleString(); } }
    ]},
    { key: 'status', title: '状态', width: 100, type: 'tag', sortable: true, filterable: true, disabled: isRowDisabled, render: function(value) {
      var statusOptions = [{ text: '在职', value: 'active', bgColor: '#52c41a', color: '#fff' }, { text: '离职', value: 'inactive', bgColor: '#ff4d4f', color: '#fff' }, { text: '待定', value: 'pending', bgColor: '#faad14', color: '#fff' }];
      var opt = statusOptions.find(function(o) { return o.value === value; });
      return { type: 'tag', tags: { tags: opt ? [opt] : [{ text: String(value), value: value }], editable: true, options: statusOptions, selectedValues: [value], multiple: false } };
    }},
    { key: 'priority-radio', field: 'priority', title: '优先级(单选)', width: 200, type: 'radio', align: 'left', filterable: true, disabled: isRowDisabled, render: function(value, row) { return { type: 'radio', radio: { value: row.data.priority, options: [{ label: '高', value: 'high' }, { label: '中', value: 'medium' }, { label: '低', value: 'low' }] } }; } },
    { key: 'priority-display', field: 'priority', title: '优先级(展示)', width: 100, align: 'center', editable: true, disabled: isRowDisabled, render: function(value) {
      var config = { high: { icon: '🔴', text: '高' }, medium: { icon: '🟡', text: '中' }, low: { icon: '🟢', text: '低' } };
      var c = config[value] || config.medium;
      return { type: 'custom', customRender: function(ctx) { ctx.fillStyle = ctx.theme.colors.cellText; ctx.font = ctx.theme.font.size + 'px ' + ctx.theme.font.family; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(c.icon + ' ' + c.text, ctx.x + ctx.width / 2, ctx.y + ctx.height / 2); } };
    }, editRender: function() { return { type: 'select', select: { options: [{ label: '🔴 高', value: 'high' }, { label: '🟡 中', value: 'medium' }, { label: '🟢 低', value: 'low' }] } }; } },
    { key: 'progress', type: 'progress', title: '进度', width: 120, align: 'center', filterable: true, disabled: isRowDisabled, render: function(value) { return { type: 'progress', progress: { value: value, shape: 'line', size: 'large', showText: true, textPosition: 'right', color: '#ff4d4f' } }; } },
    { key: 'taskProgress', type: 'progress', title: '任务进度', width: 150, align: 'center', disabled: isRowDisabled, render: function(value) { return { type: 'progress', progress: { value: value, shape: 'line', size: 'large', showText: true, textPosition: 'inside', color: [{ value: 0, color: '#ff4d4f' }, { value: 30, color: '#ff4d4f' }, { value: 50, color: '#faad14' }, { value: 80, color: '#1890ff' }, { value: 100, color: '#52c41a' }] } }; } },
    { key: 'completionRate', type: 'progress', title: '完成率', width: 80, align: 'center', disabled: isRowDisabled, render: function(value) { return { type: 'progress', progress: { value: value, shape: 'circle', size: 'small', showText: true, format: function(v) { return Math.round(v) + '%'; }, color: function(v) { return v < 30 ? '#ff4d4f' : v < 70 ? '#faad14' : '#52c41a'; } } }; } },
    { key: 'dashboard', title: '仪表盘', width: 100, disabled: isRowDisabled, render: function(value) { return { type: 'progress', progress: { value: value || 0, shape: 'dashboard', size: 'medium', status: 'success' } }; } },
    { key: 'dashboardInteractive', title: '仪表盘(可调)', width: 100, disabled: isRowDisabled, render: function(value) { return { type: 'progress', progress: { value: value || 0, shape: 'dashboard', interactive: true } }; } },
    { key: 'circleInteractive', title: '圆环(可调)', width: 80, disabled: isRowDisabled, render: function(value) { return { type: 'progress', progress: { value: value || 0, shape: 'circle', interactive: true } }; } },
    { key: 'progressOverflow', title: '溢出测试', width: 120, disabled: isRowDisabled, render: function(value) { return { type: 'progress', progress: { value: value || 0, shape: 'line', showText: true } }; } },
    { key: 'volume', title: '音量', width: 100, disabled: isRowDisabled, render: function(value) { return { type: 'progress', progress: { value: value || 0, interactive: true, shape: 'line' } }; } },
    { key: 'rating', title: '评分', width: 120, type: 'rating', align: 'center', disabled: isRowDisabled, render: function(value) { return { type: 'rating', rating: { value: value || 0, max: 5, starSize: 16, allowHalf: true, color: '#FFD700', inactiveColor: '#E0E0E0' } }; } },
    { key: 'color', title: '颜色', width: 80, type: 'color', align: 'center', editable: true, filterable: true, disabled: isRowDisabled, render: function(value) { return { type: 'color', color: { value: value || '#1890ff' } }; } },
    { key: 'skills', title: '技能标签', width: 200, type: 'tag', sortable: false, filterable: true, disabled: isRowDisabled, render: function(value) {
      var skills = Array.isArray(value) ? value : [];
      var skillOptions = ['JavaScript', 'TypeScript', 'React', 'Vue', 'Angular', 'Node.js', 'Python', 'Java', 'Go', 'Rust', 'Docker', 'Kubernetes'];
      var tags = skills.map(function(s) { return { text: s, value: s, bgColor: skillTagColors[s] && skillTagColors[s].bgColor || '#f0f0f0', color: skillTagColors[s] && skillTagColors[s].color || '#333' }; });
      var options = skillOptions.map(function(s) { return { text: s, value: s, bgColor: skillTagColors[s] && skillTagColors[s].bgColor || '#f0f0f0', color: skillTagColors[s] && skillTagColors[s].color || '#333' }; });
      return { type: 'tag', tags: { tags: tags, editable: true, options: options, selectedValues: skills, multiple: true } };
    }},
    { key: 'remark', title: '备注', width: 200, type: 'input', align: 'left', editable: true, disabled: isRowDisabled, render: function(value) { return { type: 'input', input: { value: value, placeholder: '请输入备注', multiline: true, maxRows: 5 } }; } },
    { key: 'level', title: '级别(单选)', width: 120, type: 'select', align: 'left', filterable: true, disabled: isRowDisabled, render: function(value) { return { type: 'select', select: { value: value, options: [{ label: '初级', value: 'junior' }, { label: '中级', value: 'middle' }, { label: '高级', value: 'senior' }, { label: '专家', value: 'expert' }], placeholder: '请选择级别' } }; } },
    { key: 'roles', title: '角色(多选)', width: 160, type: 'select', align: 'left', filterable: true, disabled: isRowDisabled, render: function(value, row) { return { type: 'select', select: { value: row.data.roles, multiple: true, options: [{ label: '管理员', value: 'admin' }, { label: '编辑者', value: 'editor' }, { label: '查看者', value: 'viewer' }, { label: '开发者', value: 'developer' }], placeholder: '请选择角色' } }; } },
    { key: 'enabled', title: '启用', width: 80, type: 'switch', align: 'center', filterable: true, disabled: isRowDisabled, render: function(value, row) { return { type: 'switch', switch: { checked: row.data.enabled } }; } },
    { key: 'actions', title: '操作', width: 200, type: 'buttons', align: 'center', fixed: 'right', disabled: isRowDisabled, render: function(value, row) {
      var rowIndex = parseInt(row.id.replace('row-', ''));
      var isEven = rowIndex % 2 === 0;
      var buttons = [{ text: '查看', variant: 'default', actionKey: 'view', visible: true }, { text: '编辑', variant: 'primary', actionKey: 'edit', visible: true }, { text: '删除', variant: 'danger', actionKey: 'delete', visible: isEven }, { text: '导出', variant: 'link', actionKey: 'export', visible: rowIndex < 15 }];
      return { type: 'buttons', buttons: { buttons: buttons, maxVisible: 2, moreButtonText: '更多', gap: 4 } };
    }},
    { key: 'score', title: '评分', width: 60, type: 'number', sortable: true, align: 'center', fixed: 'right', render: function(value) {
      var color = '#52c41a';
      if (value < 60) color = '#ff4d4f';
      else if (value < 80) color = '#faad14';
      return { text: String(value), style: { color: color } };
    }}
  ];

  // Complex columns generator
  function generateComplexColumns() {
    return [
      { key: 'id', title: 'ID', width: 60, type: 'number', fixed: 'left' },
      { key: 'personal', title: '个人信息', children: [
        { key: 'name', title: '姓名', width: 100, children: [{ key: 'firstName', title: '姓', width: 50 }, { key: 'lastName', title: '名', width: 50 }] },
        { key: 'contact', title: '联系方式', children: [
          { key: 'phone', title: '电话', width: 120 },
          { key: 'email', title: '邮箱', width: 180 },
          { key: 'address', title: '地址', children: [{ key: 'province', title: '省', width: 80 }, { key: 'city', title: '市', width: 80 }, { key: 'district', title: '区', width: 80 }, { key: 'street', title: '街道', width: 150 }] }
        ]}
      ]},
      { key: 'employment', title: '就业信息', children: [
        { key: 'job', title: '工作', children: [{ key: 'department', title: '部门', width: 100 }, { key: 'position', title: '职位', width: 100 }, { key: 'level', title: '级别', width: 80 }] },
        { key: 'compensation', title: '薪酬', children: [
          { key: 'baseSalary', title: '基本工资', width: 100 },
          { key: 'bonus', title: '奖金', width: 80 },
          { key: 'stock', title: '股票', width: 80 },
          { key: 'deductions', title: '扣款', children: [{ key: 'tax', title: '税', width: 80 }, { key: 'insurance', title: '社保', width: 80 }, { key: 'housing', title: '公积金', width: 80 }] }
        ]},
        { key: 'dates', title: '日期', children: [{ key: 'joinDate', title: '入职日期', width: 100 }, { key: 'probationEnd', title: '转正日期', width: 100 }, { key: 'contractEnd', title: '合同到期', width: 100 }] }
      ]},
      { key: 'performance', title: '绩效信息', children: [
        { key: 'quarterly', title: '季度绩效', children: [{ key: 'q1', title: 'Q1', width: 60 }, { key: 'q2', title: 'Q2', width: 60 }, { key: 'q3', title: 'Q3', width: 60 }, { key: 'q4', title: 'Q4', width: 60 }] },
        { key: 'skills', title: '技能评估', children: [{ key: 'technical', title: '技术能力', width: 80 }, { key: 'communication', title: '沟通能力', width: 80 }, { key: 'leadership', title: '领导力', width: 80 }, { key: 'innovation', title: '创新力', width: 80 }] }
      ]},
      { key: 'status', title: '状态', width: 80, fixed: 'right' }
    ];
  }

  function generateComplexData(count, seed) {
    seed = seed || DATA_SEED;
    var random = createSeededRandom(seed);
    var provinces = ['北京', '上海', '广东', '江苏', '浙江', '四川', '湖北', '山东'];
    var cities = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '青岛'];
    var departments = ['技术部', '产品部', '运营部', '市场部', '财务部', '人事部'];
    var positions = ['工程师', '高级工程师', '经理', '总监', '副总裁'];
    var levels = ['P5', 'P6', 'P7', 'P8', 'P9'];
    var grades = ['A', 'B', 'C', 'D'];

    var rows = [];
    for (var i = 0; i < count; i++) {
      var name = ['张', '李', '王', '刘', '陈'][i % 5] + ['伟', '芳', '娜', '敏', '静'][i % 5];
      rows.push({
        id: 'row-' + i,
        data: {
          id: i + 1,
          firstName: name.charAt(0),
          lastName: name.charAt(1),
          phone: '1' + Math.floor(random() * 9 + 1) + Math.floor(random() * 1000000000).toString().padStart(9, '0'),
          email: 'user' + i + '@example.com',
          province: provinces[i % provinces.length],
          city: cities[i % cities.length],
          district: '区' + ((i % 10) + 1),
          street: '街道' + ((i % 20) + 1) + '号',
          department: departments[i % departments.length],
          position: positions[i % positions.length],
          level: levels[i % levels.length],
          baseSalary: Math.floor(random() * 50000) + 10000,
          bonus: Math.floor(random() * 10000),
          stock: Math.floor(random() * 5000),
          tax: Math.floor(random() * 3000),
          insurance: Math.floor(random() * 2000),
          housing: Math.floor(random() * 1500),
          joinDate: '2020-0' + ((i % 9) + 1) + '-01',
          probationEnd: '2020-1' + ((i % 2) + 1) + '-01',
          contractEnd: '2023-0' + ((i % 9) + 1) + '-01',
          q1: grades[i % 4],
          q2: grades[(i + 1) % 4],
          q3: grades[(i + 2) % 4],
          q4: grades[(i + 3) % 4],
          technical: Math.floor(random() * 40) + 60,
          communication: Math.floor(random() * 40) + 60,
          leadership: Math.floor(random() * 40) + 60,
          innovation: Math.floor(random() * 40) + 60,
          status: i % 3 === 0 ? '在职' : i % 3 === 1 ? '离职' : '休假'
        }
      });
    }
    return rows;
  }

  // 1000 columns generator
  function generate1000Columns() {
    var cols = [{ key: 'id', title: 'ID', width: 60, type: 'number', fixed: 'left' }];
    for (var i = 0; i < 998; i++) cols.push({ key: 'col_' + i, title: '列' + (i + 1), width: 80, sortable: true, filterable: i < 100 });
    cols.push({ key: 'status', title: '状态', width: 80, fixed: 'right' });
    return cols;
  }

  function generate1000ColumnsData(count) {
    var rows = [];
    for (var i = 0; i < count; i++) {
      var data = { id: i + 1 };
      for (var j = 0; j < 998; j++) data['col_' + j] = '数据' + i + '-' + j;
      data.status = i % 3 === 0 ? '正常' : '异常';
      rows.push({ id: 'row-' + i, data: data });
    }
    return rows;
  }

  // Merged cells data generator
  function generateMergedCellsData(seed) {
    seed = seed || DATA_SEED;
    var random = createSeededRandom(seed);
    var mergeColumns = [
      { key: 'id', title: 'ID', width: 60, type: 'number', fixed: 'left' },
      { key: 'region', title: '区域', width: 80, fixed: 'left' },
      { key: 'department', title: '部门', width: 100 },
      { key: 'team', title: '小组', width: 100 },
      { key: 'name', title: '姓名', width: 100 },
      { key: 'q1', title: 'Q1', width: 80 },
      { key: 'q2', title: 'Q2', width: 80 },
      { key: 'q3', title: 'Q3', width: 80 },
      { key: 'q4', title: 'Q4', width: 80 },
      { key: 'halfYear', title: '上半年', width: 160 },
      { key: 'total', title: '年度总计', width: 100 },
      { key: 'status', title: '状态', width: 80, fixed: 'right' }
    ];

    var regions = ['华东', '华北', '华南', '西部'];
    var departments = ['技术部', '产品部', '运营部'];
    var teams = ['A组', 'B组', 'C组'];
    var names = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十'];

    var rows = [];
    var id = 1;
    var rowIndex = 0;
    var regionMergeStarts = [];
    var deptMergeStarts = [];
    var teamMergeStarts = [];

    for (var r = 0; r < regions.length; r++) {
      regionMergeStarts.push(rowIndex);
      for (var d = 0; d < departments.length; d++) {
        deptMergeStarts.push(rowIndex);
        for (var t = 0; t < teams.length; t++) {
          teamMergeStarts.push(rowIndex);
          for (var n = 0; n < 2; n++) {
            var q1 = Math.floor(random() * 50) + 50;
            var q2 = Math.floor(random() * 50) + 50;
            var q3 = Math.floor(random() * 50) + 50;
            var q4 = Math.floor(random() * 50) + 50;
            rows.push({
              id: 'row-' + id,
              data: { id: id, region: regions[r], department: departments[d], team: teams[t], name: names[(id - 1) % names.length], q1: q1, q2: q2, q3: q3, q4: q4, halfYear: q1 + q2, total: q1 + q2 + q3 + q4, status: id % 3 === 0 ? '优秀' : id % 3 === 1 ? '良好' : '合格' },
              cellMerges: undefined
            });
            id++;
            rowIndex++;
          }
        }
      }
    }

    // Add merges
    for (var i = 0; i < regionMergeStarts.length; i++) {
      var startRow = regionMergeStarts[i];
      var endRow = i + 1 < regionMergeStarts.length ? regionMergeStarts[i + 1] : rows.length;
      if (endRow - startRow > 1 && rows[startRow]) {
        if (!rows[startRow].cellMerges) rows[startRow].cellMerges = [];
        rows[startRow].cellMerges.push({ rowIndex: startRow, columnIndex: 0, rowspan: endRow - startRow, colspan: 1 });
      }
    }

    for (var i = 0; i < deptMergeStarts.length; i++) {
      var startRow = deptMergeStarts[i];
      var nextStart = deptMergeStarts.find(function(s) { return s > startRow; });
      var endRow = nextStart || rows.length;
      if (endRow - startRow > 1 && rows[startRow]) {
        if (!rows[startRow].cellMerges) rows[startRow].cellMerges = [];
        rows[startRow].cellMerges.push({ rowIndex: startRow, columnIndex: 1, rowspan: endRow - startRow, colspan: 1 });
      }
    }

    for (var i = 0; i < teamMergeStarts.length; i++) {
      var startRow = teamMergeStarts[i];
      var nextStart = teamMergeStarts.find(function(s) { return s > startRow; });
      var endRow = nextStart || rows.length;
      if (endRow - startRow > 1 && rows[startRow]) {
        if (!rows[startRow].cellMerges) rows[startRow].cellMerges = [];
        rows[startRow].cellMerges.push({ rowIndex: startRow, columnIndex: 2, rowspan: endRow - startRow, colspan: 1 });
      }
    }

    for (var i = 0; i < rows.length; i += 2) {
      if (rows[i]) {
        if (!rows[i].cellMerges) rows[i].cellMerges = [];
        rows[i].cellMerges.push({ rowIndex: i, columnIndex: 3, rowspan: 2, colspan: 1 });
      }
    }

    return { rows: rows, columns: mergeColumns };
  }

  // Measure and load helper
  function setRowsWithMeasure(table, rowsFn, label) {
    var createStart = performance.now();
    var rows = rowsFn();
    var createTime = performance.now() - createStart;

    console.time(label);
    var renderStart = performance.now();
    table.setRows(rows);
    var renderTime = performance.now() - renderStart;
    console.timeEnd(label);

    renderToast.show(createTime, renderTime);
    console.log(label + ' - 创建: ' + createTime.toFixed(2) + 'ms, 渲染: ' + renderTime.toFixed(2) + 'ms');
  }

  // Initialize table
  var container = document.getElementById('table-container');
  var table = new CanvasTable(container, {
    rows: generateData(100),
    columns: columns,
    width: '100%',
    height: '100%',
    stripeRows: true,
    hoverable: true,
    showRowNumbers: true,
    themeMode: 'auto',
    enableRowHeightResize: true,
    enableRowPinning: true,
    rowHeight: function(row, rowIndex) {
      if (rowIndex % 10 === 0) return 100;
      if (rowIndex % 5 === 0) return 64;
      return 32;
    },
    watermark: { enabled: true, content: 'Canvas Table', fontSize: 18, color: 'rgba(0, 0, 0, 0.12)', rotation: -22, gapX: 120, gapY: 80 },
    selection: { mode: 'cell', multi: true },
    editing: { enabled: true, mode: 'dblclick' },
    onCellClick: function(cell) { console.log('Cell clicked:', cell); },
    onSort: function(sort) { console.log('Sort changed:', sort); },
    onFilter: function(filters) { console.log('Filter changed:', filters); },
    onEditEnd: function(cell, value) { console.log('Edit ended:', cell, value); },
    onCheckboxChange: function(cell, checked) { console.log('Checkbox changed:', cell, checked); },
    onRadioChange: function(cell, value) { console.log('Radio changed:', cell, value); },
    onButtonClick: function(cell, actionKey) { console.log('Button clicked:', cell, 'actionKey:', actionKey); alert('点击了第 ' + cell.rowIndex + ' 行的按钮，actionKey: ' + (actionKey || '未设置')); },
    onSwitchChange: function(cell, checked) { console.log('Switch changed:', cell, checked); },
    onSelectChange: function(cell, value) { console.log('Select changed:', cell, value); },
    onTagsChange: function(cell, values) { console.log('Tags changed:', cell, values); },
    onRatingChange: function(cell, value) { console.log('Rating changed:', cell, value); },
    onRowHeightChange: function(row, newHeight, rowIndex) { console.log('Row height changed:', row, newHeight, rowIndex); },
    onProgressChange: function(cell, value) { console.log('Progress changed:', cell, value); },
    onColorChange: function(cell, color) { console.log('Color changed:', cell, color); },
    onImageClick: function(cell, src) { console.log('Image clicked:', cell, src); },
    onColumnHide: function(key) { console.log('Column hidden:', key); },
    onColumnShow: function(key) { console.log('Column shown:', key); },
    onColumnReorder: function(keys) { console.log('Columns reordered:', keys); }
  });

  // Button handlers
  document.getElementById('load1k').addEventListener('click', function() { setRowsWithMeasure(table, function() { return generateData(1000); }, 'Load 1K rows'); });
  document.getElementById('load10k').addEventListener('click', function() { setRowsWithMeasure(table, function() { return generateData(10000); }, 'Load 10K rows'); });
  document.getElementById('load100k').addEventListener('click', function() { setRowsWithMeasure(table, function() { return generateData(100000); }, 'Load 100K rows'); });
  document.getElementById('load1m').addEventListener('click', function() { setRowsWithMeasure(table, function() { return generateData(1000000); }, 'Load 1M rows'); });
  document.getElementById('clearSort').addEventListener('click', function() { table.sort([]); });
  document.getElementById('clearFilter').addEventListener('click', function() { table.clearFilters(); });
  document.getElementById('exportCsv').addEventListener('click', function() {
    table.export({ format: 'csv', filename: 'data.csv' }).then(function(blob) {
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'data.csv';
      a.click();
      URL.revokeObjectURL(url);
    });
  });

  var currentThemeMode = 'auto';
  var themeDisplay = document.getElementById('currentTheme');
  themeDisplay.textContent = '(auto)';
  document.getElementById('toggleTheme').addEventListener('click', function() {
    var modes = ['light', 'dark', 'auto'];
    currentThemeMode = modes[(modes.indexOf(currentThemeMode) + 1) % modes.length];
    table.setThemeMode(currentThemeMode);
    themeDisplay.textContent = '(' + currentThemeMode + ')';
  });

  document.getElementById('showHiddenColumn').addEventListener('click', function() { table.showColumn('secretCode'); });
  document.getElementById('hideAgeColumn').addEventListener('click', function() { table.hideColumn('age'); });

  var perfMonitoringEnabled = false;
  var perfButton = document.getElementById('perfMonitor');
  perfButton.addEventListener('click', function() {
    if (!perfMonitoringEnabled) {
      perfMonitoringEnabled = true;
      table.setPerformanceMonitoring(true);
      table.resetPerformanceStats();
      perfButton.textContent = '结束性能检测';
      perfButton.style.background = '#fff1f0';
      perfButton.style.borderColor = '#ff4d4f';
      perfButton.style.color = '#ff4d4f';
    } else {
      perfMonitoringEnabled = false;
      console.log('\n========== 性能检测报告 ==========\n');
      table.printPerformanceReport();
      console.log('\n==================================\n');
      table.setPerformanceMonitoring(false);
      perfButton.textContent = '开始性能检测';
      perfButton.style.background = '';
      perfButton.style.borderColor = '';
      perfButton.style.color = '';
    }
  });

  var cacheEnabled = false;
  var cacheButton = document.getElementById('cacheToggle');
  cacheButton.addEventListener('click', function() {
    cacheEnabled = !cacheEnabled;
    var currentColumns = table.getColumns();
    var updatedColumns = currentColumns.map(function(col) { return Object.assign({}, col, { cacheMode: cacheEnabled ? 'cell' : false }); });
    table.setColumns(updatedColumns);
    if (cacheEnabled) {
      cacheButton.textContent = 'Cache: ON';
      cacheButton.style.background = 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)';
      cacheButton.style.borderColor = 'transparent';
      cacheButton.style.color = '#fff';
    } else {
      cacheButton.textContent = 'Cache: OFF';
      cacheButton.style.background = '';
      cacheButton.style.borderColor = '';
      cacheButton.style.color = '';
      table.clearRenderCache();
    }
  });

  document.getElementById('loadComplex').addEventListener('click', function() {
    table.setColumns(generateComplexColumns());
    setRowsWithMeasure(table, function() { return generateComplexData(1000); }, 'Load complex columns');
  });

  document.getElementById('load1000Cols').addEventListener('click', function() {
    table.setColumns(generate1000Columns());
    setRowsWithMeasure(table, function() { return generate1000ColumnsData(1000); }, 'Load 1000 columns');
  });

  document.getElementById('loadMerged').addEventListener('click', function() {
    var mergedData = generateMergedCellsData();
    table.setColumns(mergedData.columns);
    setRowsWithMeasure(table, function() { return mergedData.rows; }, 'Load merged cells');
  });

  // Lazy load demo
  var lazyLoadSeed = 10000;
  var BATCH_SIZE = 100;
  document.getElementById('loadLazy').addEventListener('click', function() {
    lazyLoadSeed = 10000;
    var initialRows = generateData(100, 1000);
    table.destroy();

    var lazyTable = new CanvasTable(container, {
      rows: initialRows,
      columns: columns,
      width: '100%',
      height: '100%',
      stripeRows: true,
      hoverable: true,
      showRowNumbers: true,
      themeMode: 'auto',
      lazyLoad: { enabled: true, threshold: 10 },
      onLoadMore: function(params) {
        console.log('Load more triggered:', params);
        var currentCount = lazyTable.getRows().length;
        lazyTable.showLoading('加载更多数据... (当前 ' + currentCount + ' 行)');
        setTimeout(function() {
          var newRows = generateData(BATCH_SIZE, lazyLoadSeed);
          lazyLoadSeed += BATCH_SIZE;
          lazyTable.appendRows(newRows);
          lazyTable.hideLoading();
          console.log('Loaded ' + BATCH_SIZE + ' rows, total: ' + lazyTable.getRows().length);
          if (lazyTable.getRows().length >= 10000) {
            lazyTable.setHasMore(false);
            console.log('Reached max rows (10000), stopped lazy loading');
          }
        }, 1000);
      }
    });

    window.table = lazyTable;
    var infoEl = document.createElement('div');
    infoEl.style.cssText = 'position: absolute; top: 10px; right: 10px; background: rgba(0,212,170,0.9); color: #0f1419; padding: 8px 16px; border-radius: 6px; font-size: 13px; font-family: "JetBrains Mono", monospace; z-index: 100;';
    infoEl.textContent = '滚动到底部加载更多 (最多 10000 行)';
    container.appendChild(infoEl);
    setTimeout(function() { infoEl.remove(); }, 3000);
  });

  window.table = table;
}
