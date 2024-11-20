import autocannon from 'autocannon';

const formatNumber = (num) => {
    if (typeof num === 'number') {
        return num.toFixed(2);
    }
    return num;
};

const createTable = (data, title) => {
    console.log(`\n=== ${title} ===`);
    console.log('Metric'.padEnd(15), '|', 'Value'.padStart(10));
    console.log('-'.repeat(27));

    Object.entries(data).forEach(([key, value]) => {
        if (typeof value === 'object') return;
        const formattedValue = formatNumber(value);
        console.log(key.padEnd(15), '|', formattedValue.toString().padStart(10));
    });
};

const createPercentileTable = (data, title, unit = '') => {
    console.log(`\n=== ${title} Percentiles ===`);
    console.log('Percentile'.padEnd(15), '|', 'Value'.padStart(10));
    console.log('-'.repeat(27));

    const percentiles = {
        'p0.001': data.p0_001,
        p1: data.p1,
        'p2.5': data.p2_5,
        p10: data.p10,
        p25: data.p25,
        'p50 (median)': data.p50,
        p75: data.p75,
        p90: data.p90,
        'p97.5': data.p97_5,
        p99: data.p99,
        'p99.9': data.p99_9,
    };

    Object.entries(percentiles).forEach(([key, value]) => {
        const formattedValue = formatNumber(value) + unit;
        console.log(key.padEnd(15), '|', formattedValue.toString().padStart(10));
    });
};

const run = async () => {
    try {
        const result = await autocannon({
            url: 'http://localhost:4000/api/products?category=Laptops',
            connections: 100,
            duration: 60,
        }); 

        console.log('\n🚀 BENCHMARK RESULTS');
        console.log('===================');

        // Basic Stats
        console.log('\n=== Basic Statistics ===');
        console.log('Metric'.padEnd(15), '|', 'Count'.padStart(10));
        console.log('-'.repeat(27));
        console.log('Total Requests'.padEnd(15), '|', result['2xx'].toString().padStart(10));
        console.log('Errors'.padEnd(15), '|', result.errors.toString().padStart(10));
        console.log('Timeouts'.padEnd(15), '|', result.timeouts.toString().padStart(10));
        console.log('Duration (s)'.padEnd(15), '|', result.duration.toString().padStart(10));

        // Latency Stats
        createTable(
            {
                Average: result.latency.average,
                Min: result.latency.min,
                Max: result.latency.max,
                'Std Dev': result.latency.stddev,
            },
            'Latency (ms)'
        );

        // Latency Percentiles
        createPercentileTable(result.latency, 'Latency', 'ms');

        // Request Stats
        createTable(
            {
                Average: result.requests.average,
                Min: result.requests.min,
                Max: result.requests.max,
                Total: result.requests.total,
                Sent: result.requests.sent,
            },
            'Requests per Second'
        );

        // Throughput Stats (converted to KB/s)
        createTable(
            {
                Average: result.throughput.average / 1024,
                Min: result.throughput.min / 1024,
                Max: result.throughput.max / 1024,
                'Total (KB)': result.throughput.total / 1024,
            },
            'Throughput (KB/s)'
        );
    } catch (error) {
        console.error('Benchmark failed:', error);
    }
};

run();
