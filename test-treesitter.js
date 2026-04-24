import Parser from 'tree-sitter';
import JavaScript from 'tree-sitter-javascript';
try {
    const parser = new Parser();
    parser.setLanguage(JavaScript);
    console.log('tree-sitter loaded successfully');
} catch (e) {
    console.error('FAILED to load tree-sitter:', e.message);
    process.exit(1);
}
