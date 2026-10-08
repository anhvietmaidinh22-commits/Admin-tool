<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: content-type");
$file = 'loans.json';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $newLoan = json_decode($input, true);
    
    if (isset($newLoan['action']) && $newLoan['action'] === 'delete') {
        $loans = file_exists($file) ? json_decode(file_get_contents($file), true) : [];
        $loans = array_values(array_filter($loans, function($l) use ($newLoan) {
            return (string)($l['user'] ?? $l['User'] ?? '') !== (string)($newLoan['user'] ?? '');
        }));
        file_put_contents($file, json_encode($loans, JSON_UNESCAPED_UNICODE));
        echo json_encode(["status" => "success"]);
        exit;
    }
    
    if ($newLoan) {
        $loans = file_exists($file) ? json_decode(file_get_contents($file), true) : [];
        if (!is_array($loans)) $loans = [];
        
        $found = false;
        foreach ($loans as &$l) {
            if ((string)($l['user'] ?? $l['User'] ?? '') === (string)($newLoan['user'] ?? $newLoan['User'] ?? '')) {
                $l = $newLoan;
                $found = true;
                break;
            }
        }
        if (!$found) {
            array_unshift($loans, $newLoan);
        }
        
        file_put_contents($file, json_encode($loans, JSON_UNESCAPED_UNICODE));
        echo json_encode(["status" => "success"]);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (file_exists($file)) {
        echo file_get_contents($file);
    } else {
        echo json_encode([]);
    }
    exit;
}
?>
