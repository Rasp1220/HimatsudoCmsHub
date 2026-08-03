#!/usr/bin/env php
<?php
declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| 統合CMSハブ - 開発用オーケストレーター
|--------------------------------------------------------------------------
|
| Himatsudo / HimatsudoFortune / HimatsudoCmsHub の3リポジトリが
| このリポジトリの兄弟ディレクトリとしてチェックアウトされている前提で、
| 開発に必要な4プロセスを1コマンドでまとめて起動する。
|
|   - Himatsudo アプリ (API + フロントエンド)   : http://localhost:8080
|   - HimatsudoFortune アプリ (API + サイト)    : http://localhost:8180
|   - apps/himatsudo (Vite dev server)         : http://localhost:5174/himatsudo/
|   - apps/fortune   (Vite dev server)         : http://localhost:5175/fortune/
|
*/

$root = dirname(__DIR__);
$php = PHP_BINARY;
$isWin = PHP_OS_FAMILY === 'Windows';

$himatsudoRoot = $root . '/../Himatsudo';
$fortuneRoot = $root . '/../HimatsudoFortune';

$checks = [
    $himatsudoRoot . '/vendor/autoload.php' => 'cd ../Himatsudo && composer install',
    $fortuneRoot . '/vendor/autoload.php' => 'cd ../HimatsudoFortune && composer install',
    $root . '/apps/himatsudo/node_modules' => 'npm install (このリポジトリのルートで一度実行すればOK)',
    $root . '/apps/fortune/node_modules' => 'npm install (このリポジトリのルートで一度実行すればOK)',
];

$missing = false;
foreach ($checks as $path => $hint) {
    if (!file_exists($path)) {
        echo "\033[31m[ERROR] 見つかりません: {$path}\033[0m\n";
        echo "        先に実行してください: {$hint}\n";
        $missing = true;
    }
}
if ($missing) {
    exit(1);
}

$desc = [STDIN, STDOUT, STDERR];
$pipes = [];

/** @var array<string, array{proc: resource, critical: bool}> $procs */
$procs = [];

function startProcess(string $label, array $command, string $cwd, array $desc, array &$pipes, bool $critical): mixed
{
    $proc = proc_open($command, $desc, $pipes, $cwd);
    if (!is_resource($proc)) {
        echo "\033[31m[ERROR] {$label} の起動に失敗しました。\033[0m\n";
        exit(1);
    }

    return $proc;
}

$npmCmd = $isWin ? 'npm run dev' : ['npm', 'run', 'dev'];

$procs['Himatsudo app'] = [
    'proc' => startProcess('Himatsudo app', [$php, '-S', 'localhost:8080', '-t', $himatsudoRoot . '/public'], $himatsudoRoot, $desc, $pipes, true),
    'critical' => true,
];
$procs['Fortune app'] = [
    'proc' => startProcess('Fortune app', [$php, '-S', 'localhost:8180', '-t', $fortuneRoot . '/public'], $fortuneRoot, $desc, $pipes, true),
    'critical' => true,
];
$procs['apps/himatsudo'] = [
    'proc' => startProcess('apps/himatsudo', $npmCmd, $root . '/apps/himatsudo', $desc, $pipes, false),
    'critical' => false,
];
$procs['apps/fortune'] = [
    'proc' => startProcess('apps/fortune', $npmCmd, $root . '/apps/fortune', $desc, $pipes, false),
    'critical' => false,
];

echo "起動中...\n";
echo "  Himatsudo app   : http://localhost:8080\n";
echo "  Fortune app     : http://localhost:8180\n";
echo "  apps/himatsudo  : http://localhost:5174/himatsudo/\n";
echo "  apps/fortune    : http://localhost:5175/fortune/\n";
echo "停止: Ctrl+C\n\n";

while (true) {
    $anyCriticalDown = false;

    foreach ($procs as $label => $entry) {
        $running = proc_get_status($entry['proc'])['running'];
        if (!$running && $entry['critical']) {
            echo "\n{$label} が停止しました。バックエンドが無いと動作できないため、全体を終了します。\n";
            $anyCriticalDown = true;
        } elseif (!$running && !$entry['critical']) {
            echo "\n{$label} (Vite dev server) が停止しました。他のプロセスは継続します。\n";
            unset($procs[$label]);
        }
    }

    if ($anyCriticalDown || count($procs) === 0) {
        break;
    }

    usleep(300000);
}

foreach ($procs as $entry) {
    if (proc_get_status($entry['proc'])['running']) {
        proc_terminate($entry['proc']);
    }
    proc_close($entry['proc']);
}
