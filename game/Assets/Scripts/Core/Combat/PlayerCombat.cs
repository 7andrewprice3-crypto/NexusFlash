using UnityEngine;
using System.Collections;
using NeonProtocol.Core.Economy;
using NeonProtocol.Core.AI;

namespace NeonProtocol.Core.Combat
{
    public class PlayerCombat : MonoBehaviour
    {
        public static PlayerCombat Instance;

        [Header("Weapon Configuration")]
        [SerializeField] private NeonProtocol.Core.Data.WeaponData currentWeapon;
        [SerializeField] private LayerMask hitLayers;

        [Header("Perk Modifiers")]
        public float damageMultiplier = 1.0f;
        public float fireRateMultiplier = 1.0f;
        public float reloadTimeMultiplier = 1.0f;

        private int _currentClip;
        private int _currentReserve;
        private bool _isReloading;
        private float _nextFireTime;
        private Camera _mainCam;

        private void Awake()
        {
            Instance = this;
            _mainCam = Camera.main;
            InitializeWeapon();
        }

        private void InitializeWeapon()
        {
            _currentClip = currentWeapon.clipSize;
            _currentReserve = currentWeapon.maxReserve;
        }

        public void TryFire()
        {
            if (_isReloading || Time.time < _nextFireTime) return;

            if (_currentClip > 0)
            {
                ExecuteShoot();
            }
            else
            {
                StartCoroutine(ReloadRoutine());
            }
        }

        private void ExecuteShoot()
        {
            _nextFireTime = Time.time + (currentWeapon.fireRate * fireRateMultiplier);
            _currentClip--;

            Ray ray = _mainCam.ViewportPointToRay(new Vector3(0.5f, 0.5f, 0));
            if (Physics.Raycast(ray, out RaycastHit hit, 100f, hitLayers))
            {
                float hitboxMultiplier = 1.0f;

                // Simple hitbox detection based on tags or components
                if (hit.collider.CompareTag("Headshot"))
                {
                    hitboxMultiplier = 2.0f;
                }
                else if (hit.collider.CompareTag("Limb"))
                {
                    hitboxMultiplier = 0.5f;
                }

                if (hit.collider.TryGetComponent(out ZombieController zombie))
                {
                    PointsSystem.Instance.AddPoints(10); // Hit points
                    float totalDamage = currentWeapon.damage * damageMultiplier * hitboxMultiplier;
                    zombie.TakeDamage(totalDamage);
                }
            }
        }

        private IEnumerator ReloadRoutine()
        {
            if (_currentReserve <= 0 || _currentClip == currentWeapon.clipSize) yield break;

            _isReloading = true;
            yield return new WaitForSeconds(currentWeapon.reloadTime * reloadTimeMultiplier);

            int needed = currentWeapon.clipSize - _currentClip;
            int toLoad = Mathf.Min(needed, _currentReserve);

            _currentClip += toLoad;
            _currentReserve -= toLoad;

            _isReloading = false;
        }

        public void SwapWeapon(NeonProtocol.Core.Data.WeaponData newData)
        {
            currentWeapon = newData;
            InitializeWeapon();
        }

        public NeonProtocol.Core.Data.WeaponData GetCurrentWeapon() => currentWeapon;

        public void BoostAmmo(int multiplier)
        {
            _currentReserve *= multiplier;
        }
    }
}
