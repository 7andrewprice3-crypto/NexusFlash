using UnityEngine;
using NeonProtocol.Core.Economy;
using NeonProtocol.Core.Player;
using NeonProtocol.Core.Combat;

// NOTE: PerkType enum is defined in NeonPerkMachine.cs (same namespace).
// It was previously duplicated here, which caused a compilation error.

namespace NeonProtocol.Core.Interactions
{
    public class PerkMachine : MonoBehaviour
    {
        [Header("Perk Configuration")]
        [SerializeField] private PerkType perkType;
        [SerializeField] private int cost;
        [SerializeField] private string perkName;

        public void Interact()
        {
            if (PointManager.Instance.TrySpendPoints(cost))
            {
                ApplyPerk();
            }
            else
            {
                Debug.Log($"Need more points for {perkName}!");
            }
        }

        private void ApplyPerk()
        {
            PlayerHealth playerHealth = PlayerHealth.Instance;

            switch (perkType)
            {
                case PerkType.TuffNuff:
                    playerHealth.ApplyTuffNuff();
                    break;

                case PerkType.UpNAtoms:
                    playerHealth.hasUpNAtoms = true;
                    Debug.Log("Up N Atoms Purchased: Self-Revive Active.");
                    break;

                case PerkType.BangBangs:
                    ApplyBangBangs();
                    break;

                case PerkType.TrailBlazers:
                    ApplyTrailBlazers();
                    break;
            }
        }

        private void ApplyBangBangs()
        {
            if (PlayerCombat.Instance != null)
            {
                PlayerCombat.Instance.damageMultiplier *= 2.0f;
                PlayerCombat.Instance.fireRateMultiplier *= 0.67f;
            }
            Debug.Log("Bang Bangs Active: Double Damage & High Fire Rate.");
        }

        private void ApplyTrailBlazers()
        {
            // No fall damage + sliding AOE — placeholder for future implementation
            Debug.Log("Trail Blazers Active: No fall damage & sliding explosions.");
        }
    }
}
