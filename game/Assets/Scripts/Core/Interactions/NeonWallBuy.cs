using UnityEngine;
using NeonProtocol.Core.Combat;
using NeonProtocol.Core.Data;

namespace NeonProtocol.Core.Interactions
{
    public class NeonWallBuy : NeonInteractable
    {
        [Header("Weapon Settings")]
        [SerializeField] private WeaponData weaponData;

        protected override void OnPurchaseSuccess()
        {
            if (weaponData == null)
            {
                Debug.LogWarning($"[NeonWallBuy] No WeaponData assigned on {gameObject.name}!");
                return;
            }

            Debug.Log($"Purchased {weaponData.weaponName}!");
            if (PlayerCombat.Instance != null)
                PlayerCombat.Instance.SwapWeapon(weaponData);
        }
    }
}
