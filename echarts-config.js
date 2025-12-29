// 图表配置与渲染逻辑
document.addEventListener('DOMContentLoaded', function () {
    // 1. 初始化图表
    var chartDom = document.getElementById('mainChart');
    var myChart = echarts.init(chartDom, 'light', { renderer: 'canvas' });

    // 2. 动态设置更新日期（取最后一条数据的日期）
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            if (data.date && data.date.length > 0) {
                document.getElementById('updateDate').textContent = data.date[data.date.length - 1];
            }
        })
        .catch(e => console.log("更新日期获取失败，使用模拟数据日期", e));

    // 3. 核心图表配置
    var option = {
        title: {
            text: '资产增长趋势',
            subtext: '实际资产 vs 10%年化目标',
            left: 'center',
            textStyle: { fontSize: 18, color: '#2c3e50' },
            subtextStyle: { color: '#7f8c8d' }
        },
        tooltip: {
            trigger: 'axis',
            formatter: function (params) {
                var date = params[0].name;
                var actual = params[0].value;
                var target = params[1].value;
                var diff = ((actual - target) / target * 100).toFixed(2);
                var diffSymbol = diff >= 0 ? '+' : '';
                return `
                <div style="margin: 5px 0; font-weight: bold;">📅 ${date}</div>
                <div>📊 <strong>实际金额:</strong> ${actual.toFixed(2)} 万元</div>
                <div>🎯 <strong>目标金额:</strong> ${target.toFixed(2)} 万元</div>
                <div>📐 <strong>偏离幅度:</strong> <span style="color:${diff >= 0 ? '#e74c3c' : '#27ae60'}">${diffSymbol}${diff}%</span></div>
                `;
            },
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderWidth: 1,
            borderColor: '#ddd',
            textStyle: { color: '#333' }
        },
        legend: {
            data: ['实际金额', '10%年化目标', '±5%偏差通道'],
            top: 40,
            textStyle: { fontSize: 13 }
        },
        grid: { left: '3%', right: '4%', top: '18%', bottom: '10%', containLabel: true },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: [], // 从data.json动态加载
            axisLine: { lineStyle: { color: '#bdc3c7' } },
            axisLabel: { color: '#7f8c8d' }
        },
        yAxis: {
            type: 'value',
            name: '金额 (万元)',
            nameTextStyle: { color: '#7f8c8d' },
            axisLine: { show: true, lineStyle: { color: '#bdc3c7' } },
            axisLabel: {
                formatter: '{value}',
                color: '#7f8c8d'
            },
            splitLine: { lineStyle: { type: 'dashed', color: '#ecf0f1' } }
        },
        // 核心：可视化“偏差通道”
        visualMap: {
            show: false,
            dimension: 0,
            pieces: [
                { gt: 0, lte: 100, color: 'rgba(46, 204, 113, 0.08)' } // 绿色通道背景
            ]
        },
        series: [
            // 系列1：偏差通道区域（背景）
            {
                name: '±5%偏差通道',
                type: 'line',
                markArea: {
                    silent: true,
                    itemStyle: {
                        color: 'rgba(46, 204, 113, 0.08)',
                        borderColor: 'rgba(46, 204, 113, 0.3)',
                        borderWidth: 1,
                        borderType: 'dashed'
                    },
                    data: [[
                        { coord: [0, 95] }, // 起点：第0天，目标值的95%
                        { coord: [100, 105] } // 终点：第100天，目标值的105% (模拟一个范围)
                    ]]
                },
                lineStyle: { opacity: 0 }, // 隐藏通道的线
                data: []
            },
            // 系列2：10%年化目标线
            {
                name: '10%年化目标',
                type: 'line',
                smooth: true,
                showSymbol: false,
                lineStyle: {
                    color: '#3498db',
                    width: 3,
                    type: 'solid'
                },
                data: [] // 从data.json动态加载
            },
            // 系列3：实际资产线
            {
                name: '实际金额',
                type: 'line',
                smooth: true,
                showSymbol: true,
                symbolSize: 8,
                itemStyle: { color: '#e74c3c' },
                lineStyle: {
                    color: '#e74c3c',
                    width: 3
                },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(231, 76, 60, 0.4)' },
                        { offset: 1, color: 'rgba(231, 76, 60, 0.05)' }
                    ])
                },
                data: [] // 从data.json动态加载
            }
        ],
        // 响应式配置
        media: [
            { query: { maxWidth: 768 }, option: { grid: { top: '22%' }, legend: { top: 50 } } }
        ]
    };

    // 4. 加载数据并渲染图表
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            // 将数据注入图表配置
            option.xAxis.data = data.date;
            option.series[1].data = data.target; // 目标线
            option.series[2].data = data.actual; // 实际线

            // 动态设置偏差通道的范围（基于目标线的最新值）
            if (data.target && data.target.length > 0) {
                var lastTargetValue = data.target[data.target.length - 1];
                option.series[0].markArea.data[0][0].coord[1] = lastTargetValue * 0.95; // 下沿：95%
                option.series[0].markArea.data[0][1].coord[1] = lastTargetValue * 1.05; // 上沿：105%
                // 设置通道的X轴范围与数据长度一致
                option.series[0].markArea.data[0][1].coord[0] = data.date.length - 1;
            }

            // 渲染图表
            myChart.setOption(option);

            // 5. 窗口大小改变时重绘图表
            window.addEventListener('resize', function () { myChart.resize(); });
        })
        .catch(error => {
            console.error('加载数据失败:', error);
            document.getElementById('updateDate').textContent = "数据加载失败";
            // 可以在这里设置一些默认的模拟数据，保证图表能显示
            myChart.setOption(option);
        });
});