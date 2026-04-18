/* ============================================
   可视化编辑器模块
   ============================================ */

let editMode = false;
let currentTool = 'select';
let selectedElement = null;
let draggedElement = null;
let drawingCanvas = null;
let isDrawing = false;
let dragOffset = { x: 0, y: 0 };
let historyStack = [];
let historyIndex = -1;

// 初始化编辑器
document.addEventListener('DOMContentLoaded', function() {
    initEditor();
});

/**
 * 初始化编辑器
 */
function initEditor() {
    const editModeBtn = document.getElementById('editModeBtn');
    const toolbar = document.getElementById('editToolbar');
    
    if (!editModeBtn) return;
    
    // 编辑模式按钮
    editModeBtn.addEventListener('click', function() {
        toggleEditMode();
    });
    
    // 工具栏按钮
    initToolbar();

    document.addEventListener('keydown', function (e) {
        if (!editMode) return;
        if (e.key === 'Escape') {
            document.querySelectorAll('.ppt-block-selected').forEach(function (b) {
                b.classList.remove('ppt-block-selected');
            });
            if (document.body.classList.contains('admin-image-pick-mode')) {
                const btn = document.getElementById('toolAdminImage');
                if (btn) btn.click();
            }
            return;
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
            e.preventDefault();
            undo();
        }
    });
    
    // 检查是否在编辑模式
    checkEditMode();
}

/**
 * 轻提示（类 PPT 保存反馈）
 */
function showEditToast(message, ms) {
    const el = document.getElementById('editToast');
    if (!el) return;
    el.textContent = message;
    el.style.display = 'block';
    el.classList.add('edit-toast--show');
    clearTimeout(showEditToast._t);
    showEditToast._t = setTimeout(function () {
        el.classList.remove('edit-toast--show');
        el.style.display = 'none';
    }, ms || 2200);
}

/**
 * 切换编辑模式
 */
function toggleEditMode() {
    editMode = !editMode;
    const body = document.body;
    const toolbar = document.getElementById('editToolbar');
    const editModeBtn = document.getElementById('editModeBtn');
    
        if (editMode) {
        body.classList.add('edit-mode');
        if (toolbar) toolbar.style.display = 'flex';
        if (editModeBtn) editModeBtn.textContent = '退出编辑';
        if (editModeBtn) editModeBtn.classList.add('active');
        
        syncAdminImageToolbarBtn();
        setupEditModeSiteImageClicks();

        // 初始化历史记录
        historyStack = [];
        historyIndex = -1;
        saveHistory(); // 保存初始状态
        
        // 添加拖拽手柄和删除按钮
        addEditControls();

        setTool('select');
        
        // 切换到当前页面
        const activePage = document.querySelector('.page.active');
        if (activePage) {
            activePage.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    } else {
        body.classList.remove('edit-mode');
        if (toolbar) toolbar.style.display = 'none';
        if (editModeBtn) editModeBtn.textContent = '编辑模式';
        if (editModeBtn) editModeBtn.classList.remove('active');
        
        teardownEditModeSiteImageClicks();
        setAdminImagePickMode(false);
        const toolAdminImage = document.getElementById('toolAdminImage');
        if (toolAdminImage) toolAdminImage.classList.remove('active');

        disableInteractionModes();
        currentTool = null;

        // 移除编辑控件
        removeEditControls();
        
        // 保存更改
        saveChanges();
        
        // 清空历史记录
        historyStack = [];
        historyIndex = -1;
    }
}

/**
 * 初始化工具栏
 */
function initToolbar() {
    const toolSelect = document.getElementById('toolSelect');
    if (toolSelect) {
        toolSelect.addEventListener('click', function () {
            setTool('select');
        });
    }

    const toolDrag = document.getElementById('toolDrag');
    if (toolDrag) {
        toolDrag.addEventListener('click', function() {
            setTool('drag');
        });
    }
    
    // 编辑工具
    const toolEdit = document.getElementById('toolEdit');
    if (toolEdit) {
        toolEdit.addEventListener('click', function() {
            setTool('edit');
        });
    }
    
    // 新增板块工具
    const toolAdd = document.getElementById('toolAdd');
    if (toolAdd) {
        toolAdd.addEventListener('click', function() {
            showAddSectionModal();
        });
    }
    
    // 调色工具
    const toolColor = document.getElementById('toolColor');
    if (toolColor) {
        toolColor.addEventListener('click', function() {
            showColorPicker();
        });
    }
    
    // 增加大板块工具
    const toolSection = document.getElementById('toolSection');
    if (toolSection) {
        toolSection.addEventListener('click', function() {
            setTool('section');
        });
    }
    
    // 绘画工具
    const toolDraw = document.getElementById('toolDraw');
    if (toolDraw) {
        toolDraw.addEventListener('click', function() {
            setTool('draw');
        });
    }
    
    // 贴图工具
    const toolImage = document.getElementById('toolImage');
    if (toolImage) {
        toolImage.addEventListener('click', function() {
            setTool('image');
        });
    }

    const toolAdminImage = document.getElementById('toolAdminImage');
    if (toolAdminImage) {
        toolAdminImage.addEventListener('click', function () {
            const on = !document.body.classList.contains('admin-image-pick-mode');
            setAdminImagePickMode(on);
            toolAdminImage.classList.toggle('active', on);
        });
    }
    
    // 保存按钮
    const toolSave = document.getElementById('toolSave');
    if (toolSave) {
        toolSave.addEventListener('click', function() {
            saveChanges();
            showEditToast('已保存到本机');
        });
    }
    
    // 撤销按钮
    const toolUndo = document.getElementById('toolUndo');
    if (toolUndo) {
        toolUndo.addEventListener('click', function() {
            undo();
        });
    }
    
    // 重置按钮
    const toolReset = document.getElementById('toolReset');
    if (toolReset) {
        toolReset.addEventListener('click', function() {
            if (confirm('确定要重置所有更改吗？这将恢复到初始状态。')) {
                resetChanges();
            }
        });
    }
    
    // 取消按钮
    const toolCancel = document.getElementById('toolCancel');
    if (toolCancel) {
        toolCancel.addEventListener('click', function() {
            if (confirm('确定要取消编辑吗？未保存的更改将丢失。')) {
                toggleEditMode();
            }
        });
    }
}

/**
 * 保存历史状态
 */
function saveHistory() {
    const activePage = document.querySelector('.page.active');
    if (!activePage) return;
    
    // 包括可编辑的section和快速入口卡片
    const sections = Array.from(activePage.querySelectorAll('.editable-section, .access-card'));
    const placeholders = Array.from(activePage.querySelectorAll('.drag-placeholder'));
    
    const state = {
        sections: sections.map(section => {
            return {
                id: section.id || section.dataset.section || section.dataset.page || Math.random().toString(36),
                html: section.outerHTML,
                style: {
                    position: section.style.position,
                    top: section.style.top,
                    left: section.style.left,
                    zIndex: section.style.zIndex,
                    width: section.style.width
                },
                placeholderId: section.dataset.placeholderId || '',
                originalIndex: section.dataset.originalIndex || '',
                originalTopSaved: section.dataset.originalTopSaved || '',
                originalLeftSaved: section.dataset.originalLeftSaved || ''
            };
        }),
        placeholders: placeholders.map(placeholder => {
            return {
                id: placeholder.dataset.placeholderFor,
                html: placeholder.outerHTML,
                index: Array.from(placeholder.parentElement.children).indexOf(placeholder)
            };
        })
    };
    
    // 移除当前索引之后的历史记录（如果撤销后又做了新操作）
    historyStack = historyStack.slice(0, historyIndex + 1);
    
    // 添加新状态
    historyStack.push(JSON.parse(JSON.stringify(state)));
    historyIndex = historyStack.length - 1;
    
    // 限制历史记录数量
    if (historyStack.length > 50) {
        historyStack.shift();
        historyIndex--;
    }
    
    updateUndoButton();
}

/**
 * 撤销操作
 */
function undo() {
    if (historyIndex <= 0) {
        alert('没有可撤销的操作');
        return;
    }
    
    historyIndex--;
    restoreState(historyStack[historyIndex]);
    updateUndoButton();
}

/**
 * 恢复状态
 */
function restoreState(state) {
    const activePage = document.querySelector('.page.active');
    if (!activePage || !state) return;
    
    // 移除所有section、快速入口卡片和占位符
    const existingSections = activePage.querySelectorAll('.editable-section, .access-card');
    existingSections.forEach(section => section.remove());
    const placeholders = activePage.querySelectorAll('.drag-placeholder');
    placeholders.forEach(placeholder => placeholder.remove());
    
    // 兼容旧格式（如果state是数组）
    if (Array.isArray(state)) {
        state.forEach(item => {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = item.html;
            const section = tempDiv.firstElementChild;
            
            if (section) {
                if (item.style) {
                    section.style.position = item.style.position || '';
                    section.style.top = item.style.top || '';
                    section.style.left = item.style.left || '';
                    section.style.zIndex = item.style.zIndex || '';
                    section.style.width = item.style.width || '';
                }
                activePage.appendChild(section);
            }
        });
    } else {
        // 新格式：先恢复占位符
        if (state.placeholders && state.placeholders.length > 0) {
            // 按索引排序，确保顺序正确
            const sortedPlaceholders = [...state.placeholders].sort((a, b) => (a.index || 0) - (b.index || 0));
            sortedPlaceholders.forEach(placeholderData => {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = placeholderData.html;
                const placeholder = tempDiv.firstElementChild;
                if (placeholder) {
                    // 根据索引插入到正确位置
                    const children = Array.from(activePage.children);
                    if (placeholderData.index !== undefined && placeholderData.index < children.length) {
                        activePage.insertBefore(placeholder, children[placeholderData.index]);
                    } else {
                        activePage.appendChild(placeholder);
                    }
                }
            });
        }
        
        // 恢复section（包含所有文字内容）
        if (state.sections && state.sections.length > 0) {
            state.sections.forEach(item => {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = item.html;
                const section = tempDiv.firstElementChild;
                
                if (section) {
                    // 恢复样式
                    if (item.style) {
                        section.style.position = item.style.position || '';
                        section.style.top = item.style.top || '';
                        section.style.left = item.style.left || '';
                        section.style.zIndex = item.style.zIndex || '';
                        section.style.width = item.style.width || '';
                    }
                    
                    // 恢复占位符ID和原始索引
                    if (item.placeholderId) {
                        section.dataset.placeholderId = item.placeholderId;
                    }
                    if (item.originalIndex !== undefined && item.originalIndex !== '') {
                        section.dataset.originalIndex = item.originalIndex;
                    }
                    
                    // 恢复原始位置信息
                    if (item.originalTopSaved) {
                        section.dataset.originalTopSaved = item.originalTopSaved;
                    }
                    if (item.originalLeftSaved) {
                        section.dataset.originalLeftSaved = item.originalLeftSaved;
                    }
                    if (item.originalTopSaved || item.originalLeftSaved) {
                        section.dataset.originalPositionSaved = 'true';
                    }
                    
                    // 清除所有可编辑元素的原始文本标记，以便重新记录
                    section.querySelectorAll('.editable-title, .editable-text, .editable-content').forEach(el => {
                        el.removeAttribute('data-original-text');
                    });
                    
                    activePage.appendChild(section);
                }
            });
        }
    }
    
    // 重新添加编辑控件
    addEditControls();
    if (typeof applyAllSiteImagesFromStorage === 'function') {
        applyAllSiteImagesFromStorage();
    }
    
    if (currentTool === 'edit') {
        enableEditMode();
    } else if (currentTool === 'drag') {
        enableDragMode();
    } else if (currentTool === 'select' || currentTool === 'section') {
        enableSelectMode();
    }
    
    // 更新localStorage（同步历史状态）
    saveEditChanges();
}

/**
 * 创建占位符
 */
function createPlaceholder(section) {
    const placeholder = document.createElement('div');
    placeholder.className = 'drag-placeholder';
    const rect = section.getBoundingClientRect();
    placeholder.style.width = (section.offsetWidth || rect.width) + 'px';
    placeholder.style.height = (section.offsetHeight || rect.height) + 'px';
    placeholder.style.minHeight = '50px';
    placeholder.style.border = '2px dashed var(--primary-color)';
    placeholder.style.borderRadius = '8px';
    placeholder.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
    placeholder.style.margin = '0';
    placeholder.dataset.placeholderFor = section.dataset.placeholderId || section.dataset.section || Math.random().toString(36);
    return placeholder;
}

/**
 * 重置更改 - 恢复所有元素到原始布局
 */
function resetChanges() {
    const pages = document.querySelectorAll('.page');
    
    pages.forEach(page => {
        // 移除所有占位符
        const placeholders = page.querySelectorAll('.drag-placeholder');
        placeholders.forEach(placeholder => placeholder.remove());
        
        // 恢复所有section和快速入口卡片到原始位置
        const sections = page.querySelectorAll('.editable-section, .access-card');
        sections.forEach(section => {
            // 移除绝对定位
            section.style.position = '';
            section.style.top = '';
            section.style.left = '';
            section.style.zIndex = '';
            section.style.width = '';
            
            // 清除所有位置标记
            section.dataset.originalTopSaved = '';
            section.dataset.originalLeftSaved = '';
            section.dataset.originalPositionSaved = '';
            section.dataset.placeholderId = '';
            section.dataset.originalIndex = '';
            
            // 如果有原始索引，尝试恢复到原始位置
            const originalIndex = section.dataset.originalIndex;
            if (originalIndex !== undefined && originalIndex !== '') {
                const parent = section.parentElement;
                const siblings = Array.from(parent.children).filter(child => 
                    (child.classList.contains('editable-section') || child.classList.contains('access-card')) && 
                    child !== section
                );
                const targetIndex = parseInt(originalIndex);
                if (targetIndex >= 0 && targetIndex < siblings.length) {
                    parent.insertBefore(section, siblings[targetIndex]);
                }
            }
        });
    });
    
    // 清空历史记录
    historyStack = [];
    historyIndex = -1;
    
    // 重新添加编辑控件
    addEditControls();
    
    if (currentTool === 'drag') {
        enableDragMode();
    } else if (currentTool === 'edit') {
        enableEditMode();
    } else if (currentTool === 'select' || currentTool === 'section') {
        enableSelectMode();
    }
    
    updateUndoButton();
    alert('已重置到初始状态');
}

/**
 * 更新撤销按钮状态
 */
function updateUndoButton() {
    const undoBtn = document.getElementById('toolUndo');
    if (undoBtn) {
        if (historyIndex > 0) {
            undoBtn.disabled = false;
            undoBtn.style.opacity = '1';
        } else {
            undoBtn.disabled = true;
            undoBtn.style.opacity = '0.5';
        }
    }
}

/**
 * 关闭绘画层
 */
function disableDrawMode() {
    document.body.classList.remove('drawing-mode');
    if (drawingCanvas) {
        drawingCanvas.removeEventListener('mousedown', startDrawing);
        drawingCanvas.removeEventListener('mousemove', draw);
        drawingCanvas.removeEventListener('mouseup', stopDrawing);
        drawingCanvas.removeEventListener('mouseout', stopDrawing);
    }
}

function disableSelectMode() {
    if (window.__selectModeClick) {
        document.removeEventListener('click', window.__selectModeClick, false);
        window.__selectModeClick = null;
    }
    if (window.__selectModeDblClick) {
        document.removeEventListener('dblclick', window.__selectModeDblClick, true);
        window.__selectModeDblClick = null;
    }
    document.querySelectorAll('.ppt-block-selected').forEach(function (b) {
        b.classList.remove('ppt-block-selected');
    });
}

function enableSelectMode() {
    disableSelectMode();
    const main = document.getElementById('mainContent');
    window.__selectModeClick = function (e) {
        if (!editMode || currentTool !== 'select' && currentTool !== 'section') return;
        if (e.target.closest('.edit-toolbar') || e.target.closest('.drag-handle') || e.target.closest('.delete-btn')) return;
        const block = e.target.closest('.editable-section, .access-card');
        document.querySelectorAll('.ppt-block-selected').forEach(function (b) {
            b.classList.remove('ppt-block-selected');
        });
        if (block && main && main.contains(block)) {
            block.classList.add('ppt-block-selected');
        }
    };
    document.addEventListener('click', window.__selectModeClick, false);

    window.__selectModeDblClick = function (e) {
        if (!editMode || (currentTool !== 'select' && currentTool !== 'section')) return;
        const mainEl = document.getElementById('mainContent');
        const block = e.target.closest('.editable-section, .access-card');
        if (!block || !mainEl || !mainEl.contains(block)) return;
        const textEl = e.target.closest('h1, h2, h3, h4, h5, h6, p, li, .editable-title, .editable-text');
        if (!textEl || !block.contains(textEl) || !textEl.textContent.trim()) return;
        e.preventDefault();
        setTool('edit');
        requestAnimationFrame(function () {
            handleEditClick.call(textEl, { stopPropagation: function () {}, preventDefault: function () {} });
        });
    };
    document.addEventListener('dblclick', window.__selectModeDblClick, true);
}

function disableEditModeListenersOnly() {
    const main = document.getElementById('mainContent');
    if (main && window.__editorMainEditDelegate) {
        main.removeEventListener('click', window.__editorMainEditDelegate, true);
        window.__editorMainEditDelegate = null;
    }
    document.querySelectorAll('.editable-title, .editable-text, .editable-content').forEach(function (element) {
        element.removeEventListener('blur', handleEditBlur);
        element.removeEventListener('input', handleEditInput);
    });
}

/**
 * 切换工具前统一解除交互，避免拖拽/文字/选择互相抢事件
 */
function disableInteractionModes() {
    document.querySelectorAll('.editable-section, .access-card').forEach(function (section) {
        section.removeEventListener('mousedown', handleDragStart);
        section.style.cursor = '';
    });
    document.removeEventListener('mousemove', handleDrag);
    document.removeEventListener('mouseup', handleDragEnd);

    disableEditModeListenersOnly();
    disableDrawMode();
    disableSelectMode();
}

/**
 * 设置当前工具
 */
function setTool(tool) {
    disableInteractionModes();
    currentTool = tool;

    document.querySelectorAll('.toolbar-btn').forEach(function (btn) {
        btn.classList.remove('active');
    });

    const toolMap = {
        select: 'toolSelect',
        drag: 'toolDrag',
        edit: 'toolEdit',
        section: 'toolSection',
        draw: 'toolDraw',
        image: 'toolImage'
    };

    const activeBtn = document.getElementById(toolMap[tool]);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }

    if (tool === 'select' || tool === 'section') {
        if (tool === 'section') {
            showEditToast('用「板块」插入整块，或用「移动」调整顺序', 2800);
        }
        enableSelectMode();
    } else if (tool === 'drag') {
        enableDragMode();
    } else if (tool === 'edit') {
        enableEditMode();
    } else if (tool === 'draw') {
        enableDrawMode();
    } else if (tool === 'image') {
        enableImageMode();
    }
}

/**
 * 启用拖拽模式（拖拽移动）
 */
function enableDragMode() {
    isDraggingMode = false;
    draggedElement = null;
    
    // 清除所有选中状态
    document.querySelectorAll('.drag-selected').forEach(el => {
        el.classList.remove('drag-selected');
    });
    
    // 移除之前的监听器（包括快速入口卡片）
    document.querySelectorAll('.editable-section, .access-card').forEach(section => {
        section.removeEventListener('mousedown', handleDragStart);
    });
    
    // 移除全局事件监听器（防止残留）
    document.removeEventListener('mousemove', handleDrag);
    document.removeEventListener('mouseup', handleDragEnd);
    
    // 支持可编辑的section和快速入口卡片
    const sections = document.querySelectorAll('.editable-section, .access-card');
    sections.forEach(section => {
        section.style.cursor = 'move';
        
        // 只在第一次拖拽前保存原始位置，之后不再更新
        if (!section.dataset.originalPositionSaved || section.dataset.originalPositionSaved !== 'true') {
            const rect = section.getBoundingClientRect();
            const parent = section.parentElement;
            const parentRect = parent.getBoundingClientRect();
            
            // 计算原始索引（排除占位符）
            const siblings = Array.from(parent.children).filter(child => 
                !child.classList.contains('drag-placeholder')
            );
            const originalIndex = siblings.indexOf(section);
            
            section.dataset.originalTopSaved = (rect.top - parentRect.top + parent.scrollTop).toString();
            section.dataset.originalLeftSaved = (rect.left - parentRect.left + parent.scrollLeft).toString();
            section.dataset.originalIndex = originalIndex.toString();
            section.dataset.originalPositionSaved = 'true'; // 标记已保存
        }
        
        // 清除选中状态
        section.classList.remove('drag-selected');
        
        section.addEventListener('mousedown', handleDragStart);
    });
}

/**
 * 处理拖拽开始（拖拽移动）
 */
function handleDragStart(e) {
    if (currentTool !== 'drag') return;
    
    // 如果点击的是删除按钮，不拖拽
    if (e.target.closest('.delete-btn')) {
        return;
    }
    
    // 如果点击的是可编辑的文字，不拖拽（优先编辑）
    if (e.target.closest('.editable-title') || e.target.closest('.editable-text')) {
        if (e.target.isContentEditable) {
            return;
        }
    }
    
    draggedElement = e.currentTarget;
    
    // 保存历史状态
    saveHistory();
    
    // 获取元素当前位置
    const rect = draggedElement.getBoundingClientRect();
    const page = draggedElement.closest('.page');
    
    if (!page) return;
    
    // 只在第一次拖拽前保存原始位置，之后不再更新
    if (!draggedElement.dataset.originalPositionSaved || draggedElement.dataset.originalPositionSaved !== 'true') {
        const parent = draggedElement.parentElement;
        const parentRect = parent.getBoundingClientRect();
        
        draggedElement.dataset.originalTopSaved = (rect.top - parentRect.top + parent.scrollTop).toString();
        draggedElement.dataset.originalLeftSaved = (rect.left - parentRect.left + parent.scrollLeft).toString();
        draggedElement.dataset.originalPositionSaved = 'true';
        draggedElement.dataset.originalIndex = Array.from(parent.children).filter(child => 
            !child.classList.contains('drag-placeholder')
        ).indexOf(draggedElement).toString();
    }
    
    // 创建占位符（显示原始位置）
    let placeholder = document.querySelector(`[data-placeholder-for="${draggedElement.dataset.placeholderId || draggedElement.dataset.section || draggedElement.dataset.page || draggedElement.id}"]`);
    
    if (!placeholder) {
        placeholder = document.createElement('div');
        placeholder.className = 'drag-placeholder';
        placeholder.style.width = rect.width + 'px';
        placeholder.style.height = rect.height + 'px';
        placeholder.style.minHeight = '50px';
        placeholder.style.border = '2px dashed var(--primary-color)';
        placeholder.style.borderRadius = '8px';
        placeholder.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
        placeholder.style.margin = '0';
        placeholder.dataset.placeholderFor = draggedElement.dataset.section || draggedElement.dataset.page || draggedElement.id || Math.random().toString(36);
        draggedElement.dataset.placeholderId = placeholder.dataset.placeholderFor;
        
        // 找到原始位置（使用保存的原始索引）
        const parent = draggedElement.parentElement;
        const originalIndex = parseInt(draggedElement.dataset.originalIndex) || 0;
        
        // 获取所有非占位符的兄弟元素（包括可编辑的section和快速入口卡片）
        const siblings = Array.from(parent.children).filter(child => 
            child !== draggedElement && 
            !child.classList.contains('drag-placeholder') &&
            (child.classList.contains('editable-section') || child.classList.contains('access-card'))
        );
        
        // 在原始位置插入占位符
        if (originalIndex >= 0 && originalIndex < siblings.length) {
            parent.insertBefore(placeholder, siblings[originalIndex]);
        } else {
            parent.appendChild(placeholder);
        }
    }
    
    // 计算偏移量
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;
    
    // 保存原始样式
    draggedElement.dataset.originalDisplay = draggedElement.style.display || '';
    draggedElement.dataset.originalPosition = draggedElement.style.position || '';
    draggedElement.dataset.originalTop = draggedElement.style.top || '';
    draggedElement.dataset.originalLeft = draggedElement.style.left || '';
    draggedElement.dataset.originalZIndex = draggedElement.style.zIndex || '';
    
    // 设置为绝对定位
    draggedElement.style.position = 'absolute';
    draggedElement.style.zIndex = '10000';
    draggedElement.style.cursor = 'grabbing';
    draggedElement.classList.add('dragging');
    
    // 计算相对于页面的位置
    const pageRect = page.getBoundingClientRect();
    const scrollTop = page.scrollTop || window.pageYOffset;
    const scrollLeft = page.scrollLeft || window.pageXOffset;
    
    draggedElement.style.left = (rect.left - pageRect.left + scrollLeft) + 'px';
    draggedElement.style.top = (rect.top - pageRect.top + scrollTop) + 'px';
    draggedElement.style.width = rect.width + 'px';
    
    // 先移除旧的监听器（防止重复添加）
    document.removeEventListener('mousemove', handleDrag);
    document.removeEventListener('mouseup', handleDragEnd);
    
    // 添加全局事件监听器
    document.addEventListener('mousemove', handleDrag, { passive: false });
    document.addEventListener('mouseup', handleDragEnd, { passive: false });
    
    e.preventDefault();
    e.stopPropagation();
}

/**
 * 处理拖拽移动
 */
function handleDrag(e) {
    // 如果draggedElement为空，立即移除监听器并返回
    if (!draggedElement) {
        document.removeEventListener('mousemove', handleDrag);
        document.removeEventListener('mouseup', handleDragEnd);
        return;
    }
    
    const page = draggedElement.closest('.page');
    if (!page) {
        endDrag();
        return;
    }
    
    // 再次检查draggedElement（可能在endDrag中被清空）
    if (!draggedElement) {
        return;
    }
    
    const pageRect = page.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    // 计算新位置（相对于页面，考虑滚动）
    const newLeft = e.clientX - pageRect.left - dragOffset.x;
    const newTop = e.clientY - pageRect.top - dragOffset.y;
    
    // 更新位置（使用相对于页面的位置，不考虑滚动）
    draggedElement.style.left = newLeft + 'px';
    draggedElement.style.top = newTop + 'px';
    
    // 允许拖到页面外，但限制在合理范围内
    const maxLeft = pageRect.width;
    const maxTop = Math.max(pageRect.height, document.documentElement.scrollHeight - pageRect.top);
    
    if (newLeft < -draggedElement.offsetWidth) {
        draggedElement.style.left = (-draggedElement.offsetWidth + 20) + 'px';
    } else if (newLeft > maxLeft) {
        draggedElement.style.left = (maxLeft - 20) + 'px';
    }
    
    if (newTop < -draggedElement.offsetHeight) {
        draggedElement.style.top = (-draggedElement.offsetHeight + 20) + 'px';
    } else if (newTop > maxTop) {
        draggedElement.style.top = (maxTop - 20) + 'px';
    }
    
    // 自动滚动（当拖到边缘时）
    const scrollThreshold = 50;
    const scrollSpeed = 10;
    
    if (e.clientY < pageRect.top + scrollThreshold && scrollTop > 0) {
        window.scrollBy(0, -scrollSpeed);
    } else if (e.clientY > pageRect.bottom - scrollThreshold) {
        window.scrollBy(0, scrollSpeed);
    }
    
    if (e.clientX < pageRect.left + scrollThreshold && scrollLeft > 0) {
        window.scrollBy(-scrollSpeed, 0);
    } else if (e.clientX > pageRect.right - scrollThreshold) {
        window.scrollBy(scrollSpeed, 0);
    }
}

/**
 * 处理拖拽结束
 */
function handleDragEnd(e) {
    e.preventDefault();
    e.stopPropagation();
    endDrag();
}

/**
 * 结束拖拽（确保正确清理）
 */
function endDrag() {
    // 先移除事件监听器（无论draggedElement是否存在）
    document.removeEventListener('mousemove', handleDrag);
    document.removeEventListener('mouseup', handleDragEnd);
    
    if (!draggedElement) {
        return;
    }
    
    // 不移除占位符，让它保持显示，直到用户恢复位置或重置
    
    // 降低z-index，但保持绝对定位
    draggedElement.style.zIndex = '1000';
    draggedElement.style.cursor = 'move';
    draggedElement.classList.remove('dragging');
    
    // 保存当前位置到历史状态
    saveHistory();
    
    // 保存编辑修改（包括拖拽位置）
    saveEditChanges();
    
    // 清除draggedElement引用（最后清除）
    draggedElement = null;
}

/**
 * 恢复板块到原始位置
 */
function restoreToOriginalPosition(section) {
    // 移除占位符
    const placeholderId = section.dataset.placeholderId;
    if (placeholderId) {
        const placeholder = document.querySelector(`[data-placeholder-for="${placeholderId}"]`);
        if (placeholder) {
            placeholder.remove();
        }
    }
    
    // 移除绝对定位
    section.style.position = section.dataset.originalPositionSaved || '';
    section.style.top = '';
    section.style.left = '';
    section.style.zIndex = '';
    section.style.width = '';
    
    // 如果有原始索引，恢复到原始位置
    if (section.dataset.originalIndex !== undefined && section.dataset.originalIndex !== '') {
        const parent = section.parentElement;
        // 包括可编辑的section和快速入口卡片
        const siblings = Array.from(parent.children).filter(child => 
            (child.classList.contains('editable-section') || child.classList.contains('access-card')) && 
            child !== section && 
            !child.classList.contains('drag-placeholder')
        );
        const targetIndex = parseInt(section.dataset.originalIndex);
        
        // 找到占位符的位置
        const placeholder = document.querySelector(`[data-placeholder-for="${placeholderId}"]`);
        if (placeholder && placeholder.parentElement === parent) {
            parent.insertBefore(section, placeholder);
            placeholder.remove();
        } else if (targetIndex >= 0 && targetIndex < siblings.length) {
            parent.insertBefore(section, siblings[targetIndex]);
        } else if (targetIndex >= siblings.length) {
            parent.appendChild(section);
        } else {
            // 如果索引无效，尝试插入到开头
            parent.insertBefore(section, parent.firstChild);
        }
    }
    
    // 重置原始位置标记（重置后可以重新保存）
    section.dataset.originalTopSaved = '';
    section.dataset.originalLeftSaved = '';
    section.dataset.originalPositionSaved = '';
    section.dataset.placeholderId = '';
    section.dataset.originalIndex = '';
}

/**
 * 启用文字编辑（委托在 main 上，避免重复绑定与工具切换残留）
 */
function enableEditMode() {
    disableEditModeListenersOnly();
    const main = document.getElementById('mainContent');
    if (!main) return;

    window.__editorMainEditDelegate = function (e) {
        if (!editMode || currentTool !== 'edit') return;
        if (e.target.closest('.drag-handle') || e.target.closest('.delete-btn')) return;

        let textEl = e.target.closest('.editable-title, .editable-text, .editable-content');
        if (textEl && main.contains(textEl)) {
            e.preventDefault();
            e.stopPropagation();
            handleEditClick.call(textEl, e);
            return;
        }
        const section = e.target.closest('.editable-section');
        if (section && main.contains(section)) {
            const inner = e.target.closest('h1, h2, h3, h4, h5, h6, p, span, li');
            if (inner && section.contains(inner) && inner.textContent.trim()) {
                e.preventDefault();
                e.stopPropagation();
                handleEditClick.call(inner, e);
            }
        }
    };
    main.addEventListener('click', window.__editorMainEditDelegate, true);

    document.querySelectorAll('.editable-title, .editable-text, .editable-content').forEach(function (element) {
        element.addEventListener('blur', handleEditBlur);
        element.addEventListener('input', handleEditInput);
    });
}

/**
 * 处理编辑点击
 */
function handleEditClick(e) {
    if (currentTool === 'edit') {
        e.stopPropagation();
        
        // 如果元素还没有editable类，添加它
        if (!this.classList.contains('editable-title') && 
            !this.classList.contains('editable-text') && 
            !this.classList.contains('editable-content')) {
            this.classList.add('editable-content');
        }
        
        this.setAttribute('contenteditable', 'true');
        this.focus();
        
        // 选中所有文本
        const range = document.createRange();
        range.selectNodeContents(this);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    }
}

/**
 * 处理编辑失焦
 */
function handleEditBlur() {
    this.setAttribute('contenteditable', 'false');
    
    // 检查内容是否真的改变了
    const originalText = this.dataset.originalText || '';
    const currentText = this.textContent || '';
    
    if (originalText !== currentText) {
        // 内容改变了，保存历史状态
        saveHistory();
        // 保存修改到localStorage
        saveEditChanges();
        
        // 记录历史（如果有管理员登录）
        if (typeof recordHistory === 'function' && (typeof currentUserType !== 'undefined' && (currentUserType === 'admin' || currentUserType === 'superadmin'))) {
            setTimeout(() => {
                recordHistory('content', '文字编辑', '修改了文字内容');
            }, 100);
        }
    }
}

/**
 * 处理编辑输入
 */
function handleEditInput() {
    // 标记有修改
    this.dataset.modified = 'true';
}

/**
 * 添加编辑控件
 */
function addEditControls() {
    const sections = document.querySelectorAll('.editable-section');
    sections.forEach(section => {
        // 检查是否已有控件
        if (section.querySelector('.drag-handle')) return;
        
        // 确保section可以拖拽（不需要强制相对定位，因为拖拽时会改为绝对定位）
        
        // 拖拽手柄
        const dragHandle = document.createElement('div');
        dragHandle.className = 'drag-handle';
        dragHandle.innerHTML = `
            <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <circle cx="5" cy="5" r="1.5" fill="currentColor"/>
                <circle cx="15" cy="5" r="1.5" fill="currentColor"/>
                <circle cx="5" cy="10" r="1.5" fill="currentColor"/>
                <circle cx="15" cy="10" r="1.5" fill="currentColor"/>
                <circle cx="5" cy="15" r="1.5" fill="currentColor"/>
                <circle cx="15" cy="15" r="1.5" fill="currentColor"/>
            </svg>
        `;
        dragHandle.addEventListener('mousedown', function(e) {
            e.stopPropagation();
            const event = new MouseEvent('mousedown', {
                bubbles: true,
                cancelable: true,
                clientX: e.clientX,
                clientY: e.clientY,
                button: e.button
            });
            Object.defineProperty(event, 'currentTarget', {
                value: section,
                enumerable: true
            });
            handleDragStart(event);
        });
        section.style.position = 'relative';
        section.appendChild(dragHandle);
        
        // 删除按钮
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '×';
        deleteBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            saveHistory();
            if (confirm('确定要删除这个板块吗？')) {
                section.remove();
                saveHistory();
            }
        });
        section.appendChild(deleteBtn);
    });
    
    if (currentTool === 'edit') {
        enableEditMode();
    } else if (currentTool === 'drag') {
        enableDragMode();
    } else if (currentTool === 'select' || currentTool === 'section') {
        enableSelectMode();
    }
}

/**
 * 移除编辑控件
 */
function removeEditControls() {
    const handles = document.querySelectorAll('.drag-handle, .delete-btn');
    handles.forEach(handle => handle.remove());
}

/**
 * 显示新增板块弹窗
 */
function showAddSectionModal() {
    const modal = document.getElementById('addSectionModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    // 关闭按钮
    const closeBtn = document.getElementById('addSectionClose');
    const cancelBtn = document.getElementById('cancelAddSection');
    if (closeBtn) closeBtn.addEventListener('click', hideAddSectionModal);
    if (cancelBtn) cancelBtn.addEventListener('click', hideAddSectionModal);
    
    // 表单提交
    const form = document.getElementById('addSectionForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            addNewSection();
        });
    }
}

/**
 * 隐藏新增板块弹窗
 */
function hideAddSectionModal() {
    const modal = document.getElementById('addSectionModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

/**
 * 添加新板块
 */
function addNewSection() {
    const type = document.getElementById('sectionType').value;
    const title = document.getElementById('sectionTitle').value;
    const content = document.getElementById('sectionContent').value;
    
    const activePage = document.querySelector('.page.active');
    if (!activePage) return;
    
    const newSection = document.createElement('div');
    newSection.className = 'editable-section';
    newSection.setAttribute('data-section', `new-${Date.now()}`);
    
    if (type === 'text') {
        newSection.innerHTML = `
            <div class="editable-content">
                <h2 class="editable-title" contenteditable="false">${title}</h2>
                <p class="editable-text" contenteditable="false">${content}</p>
            </div>
        `;
    } else if (type === 'card') {
        newSection.className += ' info-card';
        newSection.innerHTML = `
            <h2 class="editable-title" contenteditable="false">${title}</h2>
            <p class="editable-text" contenteditable="false">${content}</p>
        `;
    } else if (type === 'image') {
        const imgKey = 'section_' + Date.now();
        newSection.innerHTML = `
            <div class="editable-content">
                <h2 class="editable-title" contenteditable="false">${title}</h2>
                <div class="site-visual image-placeholder" data-site-image="${imgKey}" style="width: 100%; min-height: 200px; background: #f0f0f0; border-radius: 8px;">
                    <img src="" alt="" style="min-height:200px;object-fit:cover" data-site-image="${imgKey}">
                </div>
            </div>
        `;
    }
    
    // 添加到当前页面
    const quickAccess = activePage.querySelector('.quick-access');
    if (quickAccess) {
        quickAccess.parentElement.insertBefore(newSection, quickAccess);
    } else {
        activePage.appendChild(newSection);
    }
    
    // 重新添加编辑控件
    addEditControls();
    if (typeof applyAllSiteImagesFromStorage === 'function') {
        applyAllSiteImagesFromStorage();
    }

    hideAddSectionModal();
    document.getElementById('addSectionForm').reset();
}

/**
 * 显示调色板
 */
function showColorPicker() {
    const modal = document.getElementById('colorPickerModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    // 预设颜色点击
    document.querySelectorAll('.color-preset').forEach(preset => {
        preset.addEventListener('click', function() {
            const color = this.getAttribute('data-color');
            document.getElementById('colorInput').value = color;
        });
    });
    
    // 应用颜色
    const applyBtn = document.getElementById('applyColor');
    if (applyBtn) {
        applyBtn.addEventListener('click', function() {
            applyColor();
        });
    }
    
    // 取消
    const cancelBtn = document.getElementById('cancelColor');
    const closeBtn = document.getElementById('colorPickerClose');
    if (cancelBtn) cancelBtn.addEventListener('click', hideColorPicker);
    if (closeBtn) closeBtn.addEventListener('click', hideColorPicker);
}

/**
 * 隐藏调色板
 */
function hideColorPicker() {
    const modal = document.getElementById('colorPickerModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

/**
 * 应用颜色
 */
function applyColor() {
    const color = document.getElementById('colorInput').value;
    
    if (selectedElement) {
        selectedElement.style.color = color;
        selectedElement = null;
    } else {
        // 如果没有选中元素，提示用户点击元素
        alert('请先点击要改变颜色的文字，然后点击调色工具');
        // 添加点击选择元素的功能
        document.body.style.cursor = 'pointer';
        const selectHandler = function(e) {
            if (e.target.classList.contains('editable-title') || 
                e.target.classList.contains('editable-text') ||
                e.target.classList.contains('editable-content')) {
                selectedElement = e.target;
                e.target.style.outline = '2px dashed ' + color;
                document.body.style.cursor = '';
                document.removeEventListener('click', selectHandler);
            }
        };
        document.addEventListener('click', selectHandler);
        setTimeout(() => {
            document.removeEventListener('click', selectHandler);
            document.body.style.cursor = '';
        }, 10000);
    }
    
    hideColorPicker();
}

/**
 * 启用绘画模式
 */
function enableDrawMode() {
    if (!drawingCanvas) {
        drawingCanvas = document.createElement('canvas');
        drawingCanvas.className = 'drawing-canvas';
        drawingCanvas.width = window.innerWidth;
        drawingCanvas.height = window.innerHeight;
        document.body.appendChild(drawingCanvas);
    }
    
    document.body.classList.add('drawing-mode');
    
    const ctx = drawingCanvas.getContext('2d');
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    drawingCanvas.removeEventListener('mousedown', startDrawing);
    drawingCanvas.removeEventListener('mousemove', draw);
    drawingCanvas.removeEventListener('mouseup', stopDrawing);
    drawingCanvas.removeEventListener('mouseout', stopDrawing);
    
    drawingCanvas.addEventListener('mousedown', startDrawing);
    drawingCanvas.addEventListener('mousemove', draw);
    drawingCanvas.addEventListener('mouseup', stopDrawing);
    drawingCanvas.addEventListener('mouseout', stopDrawing);
}

/**
 * 开始绘画
 */
function startDrawing(e) {
    isDrawing = true;
    const ctx = drawingCanvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(e.clientX, e.clientY);
}

/**
 * 绘画
 */
function draw(e) {
    if (!isDrawing) return;
    const ctx = drawingCanvas.getContext('2d');
    ctx.lineTo(e.clientX, e.clientY);
    ctx.stroke();
}

/**
 * 停止绘画
 */
function stopDrawing() {
    isDrawing = false;
}

/**
 * 启用贴图模式
 */
function enableImageMode() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const activePage = document.querySelector('.page.active');
                if (activePage) {
                    const imgSection = document.createElement('div');
                    imgSection.className = 'editable-section';
                    imgSection.innerHTML = `
                        <img src="${e.target.result}" style="max-width: 100%; border-radius: 8px;">
                    `;
                    activePage.appendChild(imgSection);
                    addEditControls();
                }
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
}

/**
 * 序列化所有 .page 到 localStorage（含图片覆盖备份，防止刷新丢失）
 */
function serializeAllPagesToStorage() {
    if (typeof syncDomImagesToOverridesFromDom === 'function') {
        try {
            syncDomImagesToOverridesFromDom();
        } catch (e) {
            console.warn('同步 DOM 图片到 overrides 时出错:', e);
        }
    }

    const pages = document.querySelectorAll('.page');
    const pageData = {};

    pages.forEach(page => {
        const pageId = page.id;
        pageData[pageId] = {
            html: page.innerHTML,
            sections: Array.from(page.querySelectorAll('.editable-section, .access-card')).map(section => {
                return {
                    html: section.outerHTML,
                    style: {
                        position: section.style.position,
                        top: section.style.top,
                        left: section.style.left,
                        zIndex: section.style.zIndex,
                        width: section.style.width
                    },
                    originalIndex: section.dataset.originalIndex || '',
                    originalTopSaved: section.dataset.originalTopSaved || '',
                    originalLeftSaved: section.dataset.originalLeftSaved || ''
                };
            })
        };
    });

    pageData.__siteImageState = {
        overrides: typeof getSiteImageOverrides === 'function' ? getSiteImageOverrides() : {},
        originals: typeof getSiteImageOriginals === 'function' ? getSiteImageOriginals() : {}
    };

    try {
        localStorage.setItem('pageStructure', JSON.stringify(pageData));
    } catch (e) {
        console.error('保存 pageStructure 失败:', e);
        alert('保存失败：数据体积可能超过浏览器限制。请删除部分贴图或缩小图片后再试。');
        throw e;
    }
}

/**
 * 保存编辑修改
 */
function saveEditChanges() {
    serializeAllPagesToStorage();

    // 记录历史（如果有管理员登录）
    if (typeof recordHistory === 'function' && (currentUserType === 'admin' || currentUserType === 'superadmin')) {
        recordHistory('layout', '页面编辑', '编辑了页面内容和布局');
    }
}

/**
 * 保存更改（退出编辑模式时调用）
 */
function saveChanges() {
    serializeAllPagesToStorage();

    // 记录历史
    if (typeof recordHistory === 'function' && (currentUserType === 'admin' || currentUserType === 'superadmin')) {
        recordHistory('layout', '页面编辑', '编辑了页面内容和布局');
    }
}

/**
 * 检查编辑模式状态
 */
function checkEditMode() {
    const saved = localStorage.getItem('editMode');
    if (saved === 'true') {
        toggleEditMode();
    }
}

// 保存编辑模式状态
window.addEventListener('beforeunload', function() {
    localStorage.setItem('editMode', editMode ? 'true' : 'false');
});

/* ============================================
   全站图片：编辑模式点击替换 + 管理员图片编辑
   ============================================ */

let editModeSiteImageDelegate = null;
let siteImageActionState = { key: '', img: null };
let cropInteraction = { active: false, x1: 0, y1: 0, x2: 0, y2: 0, natural: null, displayW: 0, displayH: 0 };
let adminImageDocumentHandler = null;

function syncAdminImageToolbarBtn() {
    const btn = document.getElementById('toolAdminImage');
    if (!btn) return;
    const logged = localStorage.getItem('adminLoggedIn') === 'true';
    btn.style.display = logged && editMode ? 'inline-flex' : 'none';
}

function setAdminImagePickMode(on) {
    document.body.classList.toggle('admin-image-pick-mode', on);
    if (on) {
        if (!adminImageDocumentHandler) {
            adminImageDocumentHandler = function (e) {
                if (!document.body.classList.contains('admin-image-pick-mode')) return;
                if (e.target.closest('#admin') || e.target.closest('.admin-modal') || e.target.closest('#editToolbar') ||
                    e.target.closest('#siteImageActionModal') || e.target.closest('#siteImageCropModal')) {
                    return;
                }
                let img = null;
                if (e.target.tagName === 'IMG') {
                    img = e.target;
                } else {
                    const sv = e.target.closest('.site-visual');
                    if (sv) img = sv.querySelector('img');
                }
                if (!img) return;
                e.preventDefault();
                e.stopPropagation();
                const key = typeof ensureSiteImageKeyForElement === 'function' ? ensureSiteImageKeyForElement(img) : img.getAttribute('data-site-image');
                openSiteImageActionModal(key, img);
            };
            document.addEventListener('click', adminImageDocumentHandler, true);
        }
    } else {
        if (adminImageDocumentHandler) {
            document.removeEventListener('click', adminImageDocumentHandler, true);
            adminImageDocumentHandler = null;
        }
    }
}

function setupEditModeSiteImageClicks() {
    teardownEditModeSiteImageClicks();
    const main = document.getElementById('mainContent');
    if (!main) return;

    editModeSiteImageDelegate = function (e) {
        if (!editMode) return;
        if (document.body.classList.contains('admin-image-pick-mode')) return;
        if (e.target.closest('.drag-handle') || e.target.closest('.delete-btn')) return;

        let img = e.target.closest('img[data-site-image]');
        if (!img) {
            const wrap = e.target.closest('.site-visual');
            if (wrap && main.contains(wrap)) {
                img = wrap.querySelector('img[data-site-image]');
            }
        }
        if (!img || !main.contains(img)) return;
        const key = img.getAttribute('data-site-image');
        if (!key) return;
        e.preventDefault();
        e.stopPropagation();
        triggerQuickImageReplace(key, img);
    };
    main.addEventListener('click', editModeSiteImageDelegate, true);
}

function teardownEditModeSiteImageClicks() {
    const main = document.getElementById('mainContent');
    if (main && editModeSiteImageDelegate) {
        main.removeEventListener('click', editModeSiteImageDelegate, true);
    }
    editModeSiteImageDelegate = null;
}

function triggerQuickImageReplace(key, img) {
    const input = document.getElementById('siteImageFileInput') || document.createElement('input');
    if (!input.id) {
        input.type = 'file';
        input.id = 'siteImageFileInput';
        input.accept = 'image/*';
        input.style.display = 'none';
        document.body.appendChild(input);
    }
    input.value = '';
    input.onchange = function () {
        const file = input.files && input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function () {
            const dataUrl = reader.result;
            if (typeof setSiteImageOverride === 'function') {
                setSiteImageOverride(key, dataUrl);
            }
            img.src = dataUrl;
            if (typeof saveHistory === 'function') saveHistory();
            if (typeof saveEditChanges === 'function') saveEditChanges();
        };
        reader.readAsDataURL(file);
    };
    input.click();
}

function openSiteImageActionModal(key, img) {
    siteImageActionState = { key: key, img: img };
    const modal = document.getElementById('siteImageActionModal');
    const hint = document.getElementById('siteImageActionHint');
    if (hint) hint.textContent = '当前图片键：' + key + '。可替换、裁剪或恢复为默认/初始图。';
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeSiteImageActionModal() {
    const modal = document.getElementById('siteImageActionModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
    siteImageActionState = { key: '', img: null };
}

function wireSiteImageActionModalOnce() {
    if (window.__siteImageActionModalWired) return;
    window.__siteImageActionModalWired = true;

    const closeBtn = document.getElementById('siteImageActionClose');
    const cancelBtn = document.getElementById('siteImageCancelBtn');
    const replaceBtn = document.getElementById('siteImageReplaceBtn');
    const restoreBtn = document.getElementById('siteImageRestoreBtn');
    const cropBtn = document.getElementById('siteImageCropBtn');
    let fileInput = document.getElementById('siteImageFileInput');
    if (!fileInput) {
        fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'siteImageFileInput';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);
    }

    function closeAll() {
        closeSiteImageActionModal();
    }

    if (closeBtn) closeBtn.addEventListener('click', closeAll);
    if (cancelBtn) cancelBtn.addEventListener('click', closeAll);

    if (replaceBtn) {
        replaceBtn.addEventListener('click', function () {
            const st = siteImageActionState;
            if (!st.key || !st.img) return;
            fileInput.value = '';
            fileInput.onchange = function () {
                const file = fileInput.files && fileInput.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = function () {
                    setSiteImageOverride(st.key, reader.result);
                    st.img.src = reader.result;
                    if (typeof saveHistory === 'function') saveHistory();
                    if (typeof saveEditChanges === 'function') saveEditChanges();
                    closeAll();
                };
                reader.readAsDataURL(file);
            };
            fileInput.click();
        });
    }

    if (restoreBtn) {
        restoreBtn.addEventListener('click', function () {
            const st = siteImageActionState;
            if (!st.key || !st.img) return;
            if (typeof clearSiteImageOverride === 'function') {
                clearSiteImageOverride(st.key);
            }
            const url = typeof getSiteImageUrl === 'function' ? getSiteImageUrl(st.key) : '';
            if (url) st.img.src = url;
            if (typeof saveHistory === 'function') saveHistory();
            if (typeof saveEditChanges === 'function') saveEditChanges();
            closeAll();
        });
    }

    if (cropBtn) {
        cropBtn.addEventListener('click', function () {
            const st = siteImageActionState;
            if (!st.img || !st.img.src) return;
            closeSiteImageActionModal();
            openSiteImageCropModal(st.key, st.img);
        });
    }
}

function openSiteImageCropModal(key, img) {
    window.__cropTarget = { key: key, img: img };
    const modal = document.getElementById('siteImageCropModal');
    const canvas = document.getElementById('siteImageCropCanvas');
    if (!modal || !canvas) return;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    const im = new Image();
    im.crossOrigin = 'anonymous';
    im.onload = function () {
        const maxW = Math.min(640, im.naturalWidth);
        const scale = maxW / im.naturalWidth;
        const dw = Math.round(im.naturalWidth * scale);
        const dh = Math.round(im.naturalHeight * scale);
        canvas.width = dw;
        canvas.height = dh;
        cropInteraction.natural = im;
        cropInteraction.displayW = dw;
        cropInteraction.displayH = dh;
        cropInteraction.active = false;
        const ctx = canvas.getContext('2d');
        function canvasCoords(e) {
            const r = canvas.getBoundingClientRect();
            const scaleX = canvas.width / (r.width || canvas.width);
            const scaleY = canvas.height / (r.height || canvas.height);
            return {
                x: (e.clientX - r.left) * scaleX,
                y: (e.clientY - r.top) * scaleY
            };
        }

        function redraw() {
            ctx.clearRect(0, 0, dw, dh);
            ctx.drawImage(im, 0, 0, dw, dh);
            const x1 = cropInteraction.x1;
            const y1 = cropInteraction.y1;
            const x2 = cropInteraction.x2;
            const y2 = cropInteraction.y2;
            const rx = Math.min(x1, x2);
            const ry = Math.min(y1, y2);
            const rw = Math.abs(x2 - x1);
            const rh = Math.abs(y2 - y1);
            if (rw > 2 && rh > 2) {
                ctx.strokeStyle = '#4caf50';
                ctx.lineWidth = 2;
                ctx.strokeRect(rx, ry, rw, rh);
            }
        }
        redraw();
        canvas.onmousedown = function (e) {
            const p = canvasCoords(e);
            cropInteraction.active = true;
            cropInteraction.x1 = p.x;
            cropInteraction.y1 = p.y;
            cropInteraction.x2 = p.x;
            cropInteraction.y2 = p.y;
        };
        canvas.onmousemove = function (e) {
            if (!cropInteraction.active) return;
            const p = canvasCoords(e);
            cropInteraction.x2 = p.x;
            cropInteraction.y2 = p.y;
            redraw();
        };
        canvas.onmouseup = function () {
            cropInteraction.active = false;
            redraw();
        };
        canvas.onmouseleave = function () {
            cropInteraction.active = false;
        };
        window.__cropRedraw = redraw;
        window.__cropCanvas = canvas;
    };
    im.onerror = function () {
        alert('无法加载图片（可能存在跨域限制）。请改用「选择新图片」上传本地文件后再裁剪。');
    };
    im.src = img.src;
}

function closeSiteImageCropModal() {
    const modal = document.getElementById('siteImageCropModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
    window.__cropTarget = null;
}

function wireSiteImageCropModalOnce() {
    if (window.__siteImageCropModalWired) return;
    window.__siteImageCropModalWired = true;

    const closeBtn = document.getElementById('siteImageCropClose');
    const cancelBtn = document.getElementById('siteImageCropCancel');
    const applyBtn = document.getElementById('siteImageCropApply');

    if (closeBtn) closeBtn.addEventListener('click', closeSiteImageCropModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeSiteImageCropModal);

    if (applyBtn) {
        applyBtn.addEventListener('click', function () {
            const t = window.__cropTarget;
            const canvas = window.__cropCanvas;
            if (!t || !canvas || !cropInteraction.natural) {
                closeSiteImageCropModal();
                return;
            }
            const x1 = cropInteraction.x1;
            const y1 = cropInteraction.y1;
            const x2 = cropInteraction.x2;
            const y2 = cropInteraction.y2;
            const rx = Math.min(x1, x2);
            const ry = Math.min(y1, y2);
            const rw = Math.abs(x2 - x1);
            const rh = Math.abs(y2 - y1);
            if (rw < 4 || rh < 4) {
                alert('请先拖动鼠标框选裁剪区域。');
                return;
            }
            const im = cropInteraction.natural;
            const sx = Math.round((rx / canvas.width) * im.naturalWidth);
            const sy = Math.round((ry / canvas.height) * im.naturalHeight);
            const sw = Math.round((rw / canvas.width) * im.naturalWidth);
            const sh = Math.round((rh / canvas.height) * im.naturalHeight);
            const out = document.createElement('canvas');
            out.width = sw;
            out.height = sh;
            const octx = out.getContext('2d');
            octx.drawImage(im, sx, sy, sw, sh, 0, 0, sw, sh);
            let dataUrl;
            try {
                dataUrl = out.toDataURL('image/jpeg', 0.9);
            } catch (err) {
                alert('导出失败（可能受跨域图片限制），请使用本地上传的图片。');
                return;
            }
            setSiteImageOverride(t.key, dataUrl);
            t.img.src = dataUrl;
            if (typeof saveHistory === 'function') saveHistory();
            if (typeof saveEditChanges === 'function') saveEditChanges();
            closeSiteImageCropModal();
        });
    }
}

document.addEventListener('DOMContentLoaded', function () {
    wireSiteImageActionModalOnce();
    wireSiteImageCropModalOnce();
});

