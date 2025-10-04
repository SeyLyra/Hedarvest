const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Running Comprehensive Test Suite for Hedarvest Contracts\n');

const testFiles = [
    'ComprehensiveLendingPool.test.js',
    'ComprehensivePoolFactory.test.js', 
    'SystemIntegration.test.js',
    'SecurityAndEdgeCases.test.js'
];

const results = {
    passed: 0,
    failed: 0,
    total: 0
};

async function runTestFile(filename) {
    console.log(`\n📋 Running ${filename}...`);
    console.log('=' .repeat(60));
    
    try {
        const output = execSync(`npx hardhat test test/${filename}`, { 
            encoding: 'utf8',
            stdio: 'pipe'
        });
        
        // Parse test results
        const lines = output.split('\n');
        let passed = 0;
        let failed = 0;
        
        for (const line of lines) {
            if (line.includes('✓') && line.includes('passing')) {
                const match = line.match(/(\d+) passing/);
                if (match) passed = parseInt(match[1]);
            }
            if (line.includes('✗') && line.includes('failing')) {
                const match = line.match(/(\d+) failing/);
                if (match) failed = parseInt(match[1]);
            }
        }
        
        results.passed += passed;
        results.failed += failed;
        results.total += passed + failed;
        
        console.log(`✅ ${filename}: ${passed} passing, ${failed} failing`);
        
        if (failed > 0) {
            console.log('\n❌ Test failures detected:');
            console.log(output);
        }
        
    } catch (error) {
        console.log(`❌ ${filename}: Test execution failed`);
        console.log(error.message);
        results.failed++;
        results.total++;
    }
}

async function runAllTests() {
    console.log('🚀 Starting comprehensive test suite...\n');
    
    for (const testFile of testFiles) {
        if (fs.existsSync(path.join(__dirname, testFile))) {
            await runTestFile(testFile);
        } else {
            console.log(`⚠️  Test file ${testFile} not found, skipping...`);
        }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${results.total}`);
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`Success Rate: ${results.total > 0 ? ((results.passed / results.total) * 100).toFixed(2) : 0}%`);
    
    if (results.failed === 0) {
        console.log('\n🎉 All tests passed! Your contracts are ready for deployment.');
    } else {
        console.log('\n⚠️  Some tests failed. Please review and fix the issues before deployment.');
        process.exit(1);
    }
}

runAllTests().catch(console.error);
