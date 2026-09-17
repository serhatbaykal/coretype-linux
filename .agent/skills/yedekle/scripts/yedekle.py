import os
import sys

import shutil
from datetime import datetime
import argparse

def backup_project(project_path):
    # Proje yolunu mutlak yola çevir
    project_path = os.path.abspath(project_path)
    
    # Proje adı ve ana klasörü belirle
    project_name = os.path.basename(project_path)
    main_folder = os.path.dirname(project_path)
    
    # Çok üst düzeyde bir yerde çalıştırılırsa uyar
    if project_name == "Antigravity-Projeler" or project_name == "":
        print("Hata: Yedeklenecek belirli bir proje klasörü içinde olmalısınız.")
        sys.exit(1)

    # Hedef klasörleri ayarla
    yedekler_folder = os.path.join(main_folder, "yedekler")
    project_backup_folder = os.path.join(yedekler_folder, project_name)
    
    # Klasörlerin olup olmadığını kontrol et ve oluştur
    os.makedirs(project_backup_folder, exist_ok=True)
    
    # Anlık tarih-saat
    now = datetime.now()
    timestamp = now.strftime("%Y-%m-%d_%H-%M-%S")
    target_folder = os.path.join(project_backup_folder, timestamp)
    
    print(f"[BILGI] [{project_name}] projesi yedekleniyor...")
    print(f"[BILGI] Hedef: {target_folder}")
    
    # Kopyalanmayacak dosyalar / klasörler
    # Genel büyük ve gereksiz dosyalar atlanıyor ancak çok gerekli olabilecekler kalıyor
    ignore_patterns = shutil.ignore_patterns(
        'node_modules', '.git', '.expo', '__pycache__', '.next', 'dist', 'build', '.idea', 'yedekler'
    )
    
    try:
        shutil.copytree(project_path, target_folder, ignore=ignore_patterns, dirs_exist_ok=True)
        print("\n[BASARILI] Tamamlandi! Yedekleme islemi basariyla gerceklestirildi.")
    except Exception as e:
        print(f"\n[HATA] Yedekleme sirasinda bir hata olustu: {e}")
        sys.exit(1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Proje anlık yedeğini oluşturur")
    parser.add_argument("path", nargs="?", default=".", help="Yedeklenecek projenin yolu (varsayılan: mevcut dizin)")
    
    args = parser.parse_args()
    backup_project(args.path)
